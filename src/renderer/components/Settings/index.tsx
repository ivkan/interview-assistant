import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Settings as SettingsIcon } from 'lucide-react'
import { APIKeysTab } from './APIKeysTab'
import { UserProfileTab } from './UserProfileTab'
import { AudioSettingsTab } from './AudioSettingsTab'
import { TranscriptionSettingsTab } from './TranscriptionSettingsTab'
import { GoogleCloudStatus } from './GoogleCloudStatus'

interface SettingsProps {
  trigger?: React.ReactNode
}

export function Settings({ trigger }: SettingsProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your Interview Assistant preferences and API keys.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-4">
            <APIKeysTab />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <UserProfileTab />
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <AudioSettingsTab />
          </TabsContent>

          <TabsContent value="transcription" className="space-y-4">
            <GoogleCloudStatus />
            <TranscriptionSettingsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}