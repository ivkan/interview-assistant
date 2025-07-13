import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { Mic, Volume2, TestTube } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useAudioCapture } from '../../hooks/useAudioCapture'

export function AudioSettingsTab() {
  const { audioSettings, updateAudioSettings } = useSettingsStore()
  const { audioDevices, audioLevel } = useAudioCapture()
  const [tempSettings, setTempSettings] = useState(audioSettings)
  const [testingAudio, setTestingAudio] = useState(false)

  const handleSave = () => {
    updateAudioSettings(tempSettings)
  }

  const handleReset = () => {
    setTempSettings(audioSettings)
  }

  const testMicrophone = async () => {
    setTestingAudio(true)
    // Test logic would go here
    setTimeout(() => setTestingAudio(false), 3000)
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

        {audioLevel > 0 && (
          <div className="space-y-2">
            <Label>Audio Level</Label>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
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
                Capture audio from other applications (experimental)
              </p>
            </div>
            <Button
              variant={tempSettings.systemAudioEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setTempSettings(prev => ({ 
                ...prev, 
                systemAudioEnabled: !prev.systemAudioEnabled 
              }))}
            >
              {tempSettings.systemAudioEnabled ? 'Enabled' : 'Disabled'}
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