import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Eye, EyeOff, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'

export function APIKeysTab() {
  const { apiKeys, updateAPIKeys } = useSettingsStore()
  const [showKeys, setShowKeys] = useState({
    openAI: false,
    deepSeek: false
  })
  const [tempKeys, setTempKeys] = useState(apiKeys)

  const handleSave = () => {
    updateAPIKeys(tempKeys)
  }

  const handleReset = () => {
    setTempKeys(apiKeys)
  }

  const toggleShowKey = (key: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const hasChanges = JSON.stringify(tempKeys) !== JSON.stringify(apiKeys)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Configure API keys for transcription and AI response services.
        </p>
      </div>

      <div className="space-y-4">

        {/* OpenAI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <div className="flex items-center space-x-2">
              {apiKeys.openAI ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://platform.openai.com/', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
            <Input
              id="openai-key"
              type={showKeys.openAI ? 'text' : 'password'}
              placeholder="Enter your OpenAI API key"
              value={tempKeys.openAI}
              onChange={(e) => setTempKeys(prev => ({ ...prev, openAI: e.target.value }))}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleShowKey('openAI')}
            >
              {showKeys.openAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Uses GPT-4o-mini for AI responses (recommended)
          </p>
        </div>

        <Separator />

        {/* DeepSeek */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="deepseek-key">DeepSeek API Key</Label>
            <div className="flex items-center space-x-2">
              {apiKeys.deepSeek ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://www.deepseek.com/', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
            <Input
              id="deepseek-key"
              type={showKeys.deepSeek ? 'text' : 'password'}
              placeholder="Enter your DeepSeek API key"
              value={tempKeys.deepSeek}
              onChange={(e) => setTempKeys(prev => ({ ...prev, deepSeek: e.target.value }))}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleShowKey('deepSeek')}
            >
              {showKeys.deepSeek ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Alternative AI provider, cost-effective option
          </p>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Requirements</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Google Cloud transcription uses service account authentication (configured via environment)</li>
          <li>• At least one AI provider (OpenAI or DeepSeek) is required for responses</li>
          <li>• API keys are stored securely and never shared</li>
        </ul>
      </div>

      {hasChanges && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}