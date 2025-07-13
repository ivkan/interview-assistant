import { useState, useEffect, useCallback } from 'react'
import { audioCaptureService } from '../services/audioCapture'
import { useInterviewStore } from '../store/interviewStore'

interface AudioDevice {
  deviceId: string
  label: string
}

interface SystemAudioSource {
  id: string
  name: string
  thumbnail: string
}

interface UseAudioCaptureProps {
  onAudioData?: (samples: Float32Array, sampleRate: number) => void
}

export function useAudioCapture(props?: UseAudioCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [systemSources, setSystemSources] = useState<SystemAudioSource[]>([])
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('default')
  const [selectedSystemSource, setSelectedSystemSource] = useState<string | null>(null)
  
  const { isActive } = useInterviewStore()

  // Initialize audio devices
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const devices = await audioCaptureService.initialize()
        setAudioDevices(devices.map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`
        })))
      } catch (error) {
        console.error('Failed to initialize audio devices:', error)
      }
    }

    initializeDevices()
  }, [])

  // Load system audio sources
  const loadSystemSources = useCallback(async () => {
    try {
      const sources = await audioCaptureService.getSystemAudioSources()
      setSystemSources(sources || [])
    } catch (error) {
      console.error('Failed to load system sources:', error)
    }
  }, [])

  // Start/stop capture based on interview state
  useEffect(() => {
    if (isActive && !isCapturing) {
      startCapture()
    } else if (!isActive && isCapturing) {
      stopCapture()
    }
  }, [isActive])

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

    audioCaptureService.on('audio-level', handleAudioLevel)
    audioCaptureService.on('audio-data', handleAudioData)

    return () => {
      audioCaptureService.off('audio-level', handleAudioLevel)
      audioCaptureService.off('audio-data', handleAudioData)
    }
  }, [props?.onAudioData])

  const startCapture = async () => {
    try {
      await audioCaptureService.startCapture({
        microphoneDeviceId: selectedMicrophone,
        systemAudioSourceId: selectedSystemSource || undefined
      })
      setIsCapturing(true)
    } catch (error) {
      console.error('Failed to start audio capture:', error)
      throw error
    }
  }

  const stopCapture = async () => {
    try {
      await audioCaptureService.stopCapture()
      setIsCapturing(false)
      setAudioLevel(0)
    } catch (error) {
      console.error('Failed to stop audio capture:', error)
    }
  }

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