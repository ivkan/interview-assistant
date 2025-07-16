import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { Mic, Volume2, TestTube } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
// ELECTRON LEGACY - Audio capture hook commented out for browser version
// import { useSafeAudioCapture as useAudioCapture } from '../../hooks/useSafeAudioCapture'

export function AudioSettingsTab() {
  const { audioSettings, updateAudioSettings } = useSettingsStore()
  const [tempSettings, setTempSettings] = useState(audioSettings)
  const [testingAudio, setTestingAudio] = useState(false)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)

  const handleSave = () => {
    updateAudioSettings(tempSettings)
  }

  const handleReset = () => {
    setTempSettings(audioSettings)
  }

  // Load available audio devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        setAudioDevices(audioInputs)
      } catch (error) {
        console.error('Failed to load audio devices:', error)
      }
    }
    
    loadDevices()
  }, [])

  const testMicrophone = async () => {
    setTestingAudio(true)
    setAudioLevel(0)
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: tempSettings.microphoneDeviceId === 'default' ? undefined : tempSettings.microphoneDeviceId,
          echoCancellation: tempSettings.echoCancellation,
          noiseSuppression: tempSettings.noiseSuppression
        }
      })
      
      setMicPermissionGranted(true)
      
      // Create audio context for level monitoring
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      source.connect(analyser)
      analyser.fftSize = 256
      
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const updateLevel = () => {
        if (testingAudio) {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
          setAudioLevel(Math.min(100, (average / 128) * 100))
          requestAnimationFrame(updateLevel)
        }
      }
      
      updateLevel()
      
      // Test for 5 seconds
      setTimeout(() => {
        setTestingAudio(false)
        setAudioLevel(0)
        stream.getTracks().forEach(track => track.stop())
        audioContext.close()
      }, 5000)
      
    } catch (error) {
      console.error('Microphone test failed:', error)
      setTestingAudio(false)
      setMicPermissionGranted(false)
    }
  }

  const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(audioSettings)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Audio Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure microphone and audio processing options.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="microphone">Microphone Device</Label>
          <Select
            value={tempSettings.microphoneDeviceId}
            onValueChange={(value) => setTempSettings(prev => ({ ...prev, microphoneDeviceId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Microphone</SelectItem>
              {audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Microphone Test</Label>
            <p className="text-xs text-muted-foreground">Test your microphone levels</p>
          </div>
          <Button
            variant="outline"
            onClick={testMicrophone}
            disabled={testingAudio}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testingAudio ? 'Testing...' : 'Test Mic'}
          </Button>
        </div>

        {testingAudio && (
          <div className="space-y-2">
            <Label>Audio Level</Label>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Speak into your microphone to test the audio level
            </p>
          </div>
        )}
        
        {!micPermissionGranted && !testingAudio && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Click "Test Mic" to grant microphone permission and test audio levels
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Audio Processing</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Echo Cancellation</Label>
              <p className="text-xs text-muted-foreground">
                Reduces echo and feedback (recommended)
              </p>
            </div>
            <Button
              variant={tempSettings.echoCancellation ? "default" : "outline"}
              size="sm"
              onClick={() => setTempSettings(prev => ({ 
                ...prev, 
                echoCancellation: !prev.echoCancellation 
              }))}
            >
              {tempSettings.echoCancellation ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Noise Suppression</Label>
              <p className="text-xs text-muted-foreground">
                Filters out background noise (recommended)
              </p>
            </div>
            <Button
              variant={tempSettings.noiseSuppression ? "default" : "outline"}
              size="sm"
              onClick={() => setTempSettings(prev => ({ 
                ...prev, 
                noiseSuppression: !prev.noiseSuppression 
              }))}
            >
              {tempSettings.noiseSuppression ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>System Audio Capture</Label>
              <p className="text-xs text-muted-foreground">
                Not available in browser version (security limitation)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
            >
              Not Available
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2 text-yellow-900 dark:text-yellow-100">
          🎤 Audio Tips
        </h4>
        <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>• Use a dedicated microphone for better quality</li>
          <li>• Ensure you're in a quiet environment</li>
          <li>• Keep echo cancellation and noise suppression enabled</li>
          <li>• Test your microphone before important interviews</li>
        </ul>
      </div>

      {hasChanges && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      )}
    </div>
  )
}