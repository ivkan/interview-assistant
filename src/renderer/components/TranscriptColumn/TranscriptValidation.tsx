import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Mic, MicOff } from 'lucide-react'
import { useGoogleSpeechTranscription } from '../../hooks/useGoogleSpeechTranscription'
import { useSafeAudioCapture } from '../../hooks/useSafeAudioCapture'
import { useSettingsStore } from '../../store/settingsStore'
import { AudioLevelIndicator } from '../AudioLevelIndicator'

export function TranscriptValidation() {
  const { isTranscribing, error, connectionStatus, partialTranscript } = useGoogleSpeechTranscription()
  const { isCapturing, audioLevel } = useSafeAudioCapture()
  const { apiKeys } = useSettingsStore()
  const [testResults, setTestResults] = useState<{
    networkIcon: 'pass' | 'fail' | 'pending'
    audioLevel: 'pass' | 'fail' | 'pending'
    transcriptionService: 'pass' | 'fail' | 'pending'
  }>({
    networkIcon: 'pending',
    audioLevel: 'pending',
    transcriptionService: 'pending'
  })

  // Test network icon functionality
  useEffect(() => {
    const testNetworkIcon = () => {
      if (connectionStatus === 'connected' && isTranscribing) {
        setTestResults(prev => ({ ...prev, networkIcon: 'pass' }))
      } else if (connectionStatus === 'disconnected' && !isTranscribing) {
        setTestResults(prev => ({ ...prev, networkIcon: 'pass' }))
      } else if (connectionStatus === 'connecting') {
        setTestResults(prev => ({ ...prev, networkIcon: 'pass' }))
      } else {
        setTestResults(prev => ({ ...prev, networkIcon: 'fail' }))
      }
    }

    testNetworkIcon()
  }, [connectionStatus, isTranscribing])

  // Test audio level functionality
  useEffect(() => {
    const testAudioLevel = () => {
      if (isCapturing && audioLevel > 0) {
        setTestResults(prev => ({ ...prev, audioLevel: 'pass' }))
      } else if (!isCapturing && audioLevel === 0) {
        setTestResults(prev => ({ ...prev, audioLevel: 'pass' }))
      } else if (isCapturing && audioLevel === 0) {
        setTestResults(prev => ({ ...prev, audioLevel: 'fail' }))
      } else {
        setTestResults(prev => ({ ...prev, audioLevel: 'pending' }))
      }
    }

    testAudioLevel()
  }, [isCapturing, audioLevel])

  // Test transcription service
  useEffect(() => {
    const testTranscriptionService = () => {
      if (error) {
        setTestResults(prev => ({ ...prev, transcriptionService: 'fail' }))
      } else if (isTranscribing && connectionStatus === 'connected') {
        setTestResults(prev => ({ ...prev, transcriptionService: 'pass' }))
      } else if (!apiKeys.googleCloud) {
        setTestResults(prev => ({ ...prev, transcriptionService: 'fail' }))
      } else {
        setTestResults(prev => ({ ...prev, transcriptionService: 'pending' }))
      }
    }

    testTranscriptionService()
  }, [error, isTranscribing, connectionStatus, apiKeys.googleCloud])

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pass</Badge>
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Live Transcript Block Validation</CardTitle>
        <CardDescription>
          Validation results for network icon, audio level indicator, and transcription service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Network Icon Test */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(testResults.networkIcon)}
            <div>
              <h3 className="font-medium">Network Icon Functionality</h3>
              <p className="text-sm text-muted-foreground">
                Status: {connectionStatus} | Transcribing: {isTranscribing ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-blue-500" />
            ) : connectionStatus === 'connecting' ? (
              <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
            {getStatusBadge(testResults.networkIcon)}
          </div>
        </div>

        {/* Audio Level Test */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(testResults.audioLevel)}
            <div>
              <h3 className="font-medium">Audio Level Indicator</h3>
              <p className="text-sm text-muted-foreground">
                Capturing: {isCapturing ? 'Yes' : 'No'} | Level: {audioLevel.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isCapturing ? (
              <Mic className="w-4 h-4 text-green-500" />
            ) : (
              <MicOff className="w-4 h-4 text-muted-foreground" />
            )}
            <AudioLevelIndicator level={audioLevel} />
            {getStatusBadge(testResults.audioLevel)}
          </div>
        </div>

        {/* Transcription Service Test */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(testResults.transcriptionService)}
            <div>
              <h3 className="font-medium">Transcription Service</h3>
              <p className="text-sm text-muted-foreground">
                {error ? `Error: ${error.message}` : 'Service operational'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(testResults.transcriptionService)}
          </div>
        </div>

        {/* Partial Transcript Display */}
        {partialTranscript && (
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <h3 className="font-medium mb-2">Partial Transcript</h3>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              &ldquo;{partialTranscript}&rdquo;
            </p>
          </div>
        )}

        {/* Environment Information */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="font-medium mb-2">Environment Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Electron: {navigator.userAgent.includes('Electron') ? 'Yes' : 'No'}</div>
            <div>Google Cloud API: {apiKeys.googleCloud ? 'Configured' : 'Not configured'}</div>
            <div>Audio Context: {typeof window.AudioContext !== 'undefined' ? 'Supported' : 'Not supported'}</div>
            <div>getUserMedia: {typeof navigator.mediaDevices?.getUserMedia !== 'undefined' ? 'Supported' : 'Not supported'}</div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setTestResults({
              networkIcon: 'pending',
              audioLevel: 'pending',
              transcriptionService: 'pending'
            })}
          >
            Reset Tests
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log('Validation Results:', testResults)
              console.log('Connection Status:', connectionStatus)
              console.log('Audio Level:', audioLevel)
              console.log('Is Transcribing:', isTranscribing)
              console.log('Error:', error)
            }}
          >
            Debug to Console
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}