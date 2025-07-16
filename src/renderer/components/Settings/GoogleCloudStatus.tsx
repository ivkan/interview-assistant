import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { CheckCircle, XCircle, AlertCircle, Cloud } from 'lucide-react'

export function GoogleCloudStatus() {
  // Check environment configuration
  const hasProjectId = !!import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID
  const isConfigured = hasProjectId // Service account is handled by main process
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Cloud className="w-5 h-5" />
          <span>Google Cloud Speech-to-Text</span>
        </CardTitle>
        <CardDescription>
          Service account authentication status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Service Status</span>
          <div className="flex items-center space-x-2">
            {isConfigured ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">Configured</Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <Badge variant="outline">Not Configured</Badge>
              </>
            )}
          </div>
        </div>

        {hasProjectId && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Project ID</span>
            <span className="text-sm text-muted-foreground font-mono">
              {import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID}
            </span>
          </div>
        )}

        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="text-xs font-medium mb-1">Authentication Method</h4>
          <p className="text-xs text-muted-foreground">
            Using service account credentials from environment
          </p>
        </div>

        {!isConfigured && (
          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
            <h4 className="text-xs font-medium mb-1 text-yellow-900 dark:text-yellow-100">
              Configuration Required
            </h4>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Ensure GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_CLOUD_PROJECT_ID are set in your .env file
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}