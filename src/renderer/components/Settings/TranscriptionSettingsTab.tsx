import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { useSettingsStore } from '../../store/settingsStore'

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'fr-CA', name: 'French (Canada)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian (Russia)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (Korea)' },
  { code: 'zh-CN', name: 'Chinese (Mandarin, China)' },
  { code: 'ar-AE', name: 'Arabic (UAE)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)' },
  { code: 'sv-SE', name: 'Swedish (Sweden)' },
  { code: 'da-DK', name: 'Danish (Denmark)' },
  { code: 'no-NO', name: 'Norwegian (Norway)' },
  { code: 'fi-FI', name: 'Finnish (Finland)' }
]

export function TranscriptionSettingsTab() {
  const { transcriptionSettings, updateTranscriptionSettings } = useSettingsStore()
  const [tempSettings, setTempSettings] = useState(transcriptionSettings)

  const handleSave = () => {
    updateTranscriptionSettings(tempSettings)
  }

  const handleReset = () => {
    setTempSettings(transcriptionSettings)
  }

  const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(transcriptionSettings)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Transcription Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure language and transcription behavior.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Auto-detect Language</Label>
            <p className="text-xs text-muted-foreground">
              Automatically detect the spoken language
            </p>
          </div>
          <Button
            variant={tempSettings.autoDetectLanguage ? "default" : "outline"}
            size="sm"
            onClick={() => setTempSettings(prev => ({ 
              ...prev, 
              autoDetectLanguage: !prev.autoDetectLanguage 
            }))}
          >
            {tempSettings.autoDetectLanguage ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {!tempSettings.autoDetectLanguage && (
          <div className="space-y-2">
            <Label htmlFor="language">Transcription Language</Label>
            <Select
              value={tempSettings.language}
              onValueChange={(value) => setTempSettings(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Processing Options</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Automatic Punctuation</Label>
              <p className="text-xs text-muted-foreground">
                Add punctuation to transcribed text
              </p>
            </div>
            <Button
              variant={tempSettings.punctuation ? "default" : "outline"}
              size="sm"
              onClick={() => setTempSettings(prev => ({ 
                ...prev, 
                punctuation: !prev.punctuation 
              }))}
            >
              {tempSettings.punctuation ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Speaker Labels</Label>
              <p className="text-xs text-muted-foreground">
                Identify different speakers (experimental)
              </p>
            </div>
            <Button
              variant={tempSettings.speakerLabels ? "default" : "outline"}
              size="sm"
              onClick={() => setTempSettings(prev => ({ 
                ...prev, 
                speakerLabels: !prev.speakerLabels 
              }))}
            >
              {tempSettings.speakerLabels ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2 text-green-900 dark:text-green-100">
          🌍 Language Support
        </h4>
        <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
          <li>• Auto-detection works best with clear speech</li>
          <li>• Manual language selection improves accuracy</li>
          <li>• AI responses will match your selected language</li>
          <li>• Quality may vary for less common languages</li>
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