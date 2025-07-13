import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useSettingsStore } from '../../store/settingsStore'

export function UserProfileTab() {
  const { userProfile, updateUserProfile } = useSettingsStore()
  const [tempProfile, setTempProfile] = useState(userProfile)

  const handleSave = () => {
    updateUserProfile(tempProfile)
  }

  const handleReset = () => {
    setTempProfile(userProfile)
  }

  const hasChanges = JSON.stringify(tempProfile) !== JSON.stringify(userProfile)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">User Profile</h3>
        <p className="text-sm text-muted-foreground">
          Add your background information to get more personalized AI responses.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position">Position/Role</Label>
            <Input
              id="position"
              placeholder="e.g., Senior Frontend Engineer"
              value={tempProfile.position}
              onChange={(e) => setTempProfile(prev => ({ ...prev, position: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview-type">Interview Type</Label>
            <Select
              value={tempProfile.interviewType}
              onValueChange={(value) => setTempProfile(prev => ({ ...prev, interviewType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Interview</SelectItem>
                <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                <SelectItem value="system-design">System Design</SelectItem>
                <SelectItem value="general">General Interview</SelectItem>
                <SelectItem value="phone-screen">Phone Screen</SelectItem>
                <SelectItem value="final-round">Final Round</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background">Background Summary</Label>
          <Textarea
            id="background"
            placeholder="Brief summary of your professional background, education, and key achievements..."
            className="min-h-[100px]"
            value={tempProfile.background}
            onChange={(e) => setTempProfile(prev => ({ ...prev, background: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            This helps the AI provide more relevant and personalized responses
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resume">Resume/Experience Details</Label>
          <Textarea
            id="resume"
            placeholder="Detailed work experience, skills, projects, and accomplishments..."
            className="min-h-[150px]"
            value={tempProfile.resume}
            onChange={(e) => setTempProfile(prev => ({ ...prev, resume: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Include specific technologies, years of experience, notable projects
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Key Skills</Label>
          <Input
            id="skills"
            placeholder="React, TypeScript, Node.js, AWS, etc. (comma-separated)"
            value={tempProfile.skills.join(', ')}
            onChange={(e) => {
              const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s)
              setTempProfile(prev => ({ ...prev, skills }))
            }}
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
          💡 Tips for Better AI Responses
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Be specific about your experience and achievements</li>
          <li>• Include years of experience with technologies</li>
          <li>• Mention notable projects or companies you've worked with</li>
          <li>• Add any certifications or education details</li>
          <li>• The more context you provide, the better the AI responses will be</li>
        </ul>
      </div>

      {hasChanges && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave}>
            Save Profile
          </Button>
        </div>
      )}
    </div>
  )
}