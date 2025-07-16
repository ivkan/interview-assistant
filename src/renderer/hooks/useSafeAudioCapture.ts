import { useState, useEffect, useCallback, useRef } from 'react'
import { safeAudioCaptureService } from '../services/safeAudioCapture'
import { useInterviewStore } from '../store/interviewStore'

interface AudioDevice {
  deviceId: string
  label: string
}

interface UseAudioCaptureProps {
  onAudioData?: (samples: Float32Array, sampleRate: number) => void
}

export function useSafeAudioCapture(props?: UseAudioCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [systemSources, setSystemSources] = useState<any[]>([])
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('default')
  const [selectedSystemSource, setSelectedSystemSource] = useState<string | null>(null)
  
  const { isActive } = useInterviewStore()
  const isStartingRef = useRef(false)

  // Initialize audio devices
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const devices = await safeAudioCaptureService.getAudioDevices()
        const audioInputs = devices.map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId}`
        }))
        setAudioDevices(audioInputs)
      } catch (error) {
        console.error('Failed to get audio devices:', error)
      }
    }

    initializeDevices()
  }, [])

  const loadSystemSources = useCallback(async () => {
    try {
      const sources = await safeAudioCaptureService.getSystemAudioSources()
      setSystemSources(sources || [])
    } catch (error) {
      console.error('Failed to load system sources:', error)
    }
  }, [])

  // Define capture functions
  const startCapture = useCallback(async () => {
    if (isStartingRef.current) {
      console.log('⚠️ Audio capture already starting, skipping...')
      return
    }
    
    isStartingRef.current = true
    
    try {
      await safeAudioCaptureService.startCapture({
        microphoneDeviceId: selectedMicrophone
      })
      setIsCapturing(true)
    } catch (error) {
      console.error('Failed to start audio capture:', error)
    } finally {
      isStartingRef.current = false
    }
  }, [selectedMicrophone])

  const stopCapture = useCallback(async () => {
    try {
      await safeAudioCaptureService.stopCapture()
      setIsCapturing(false)
      setAudioLevel(0)
    } catch (error) {
      console.error('Failed to stop audio capture:', error)
    }
  }, [])

  // Listen to audio level changes and data
  useEffect(() => {
    const handleAudioLevel = (level: number) => {
      setAudioLevel(level)
    }

    const handleAudioData = (samples: Float32Array, sampleRate: number) => {
      if (props?.onAudioData) {
        props.onAudioData(samples, sampleRate)
      }
    }

    safeAudioCaptureService.on('audio-level', handleAudioLevel)
    safeAudioCaptureService.on('audio-data', handleAudioData)

    return () => {
      safeAudioCaptureService.off('audio-level', handleAudioLevel)
      safeAudioCaptureService.off('audio-data', handleAudioData)
    }
  }, [props?.onAudioData])

  // Start/stop capture based on interview state - only if we have an onAudioData callback (main transcription component)
  useEffect(() => {
    if (!props?.onAudioData) return // Don't start capture if no callback is provided
    
    let mounted = true
    
    const handleCaptureToggle = async () => {
      try {
        if (!mounted) return
        
        if (isActive && !isCapturing) {
          console.log(`[${new Date().toISOString()}] 🎤 Starting safe audio capture...`)
          await startCapture()
        } else if (!isActive && isCapturing) {
          console.log(`[${new Date().toISOString()}] 🛑 Stopping safe audio capture...`)
          await stopCapture()
        }
      } catch (error) {
        console.error('❌ Error in audio capture effect:', error)
      }
    }
    
    handleCaptureToggle()
    
    return () => {
      mounted = false
    }
  }, [isActive, isCapturing, startCapture, stopCapture, props?.onAudioData])

  return {
    isCapturing,
    audioLevel,
    audioDevices,
    systemSources,
    selectedMicrophone,
    selectedSystemSource,
    setSelectedMicrophone,
    setSelectedSystemSource,
    loadSystemSources,
    startCapture,
    stopCapture
  }
}