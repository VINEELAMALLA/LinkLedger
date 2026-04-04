'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Save, ArrowLeft } from "lucide-react"

type UserProfile = {
  userType: 'student' | 'employee' | ''
  fieldOfStudy: string
  profession: string
  interests: string[]
}

const interestOptions = [
  'Internships',
  'Jobs',
  'Courses',
  'AI Tools',
  'Technology',
  'Business',
  'Healthcare',
  'Engineering',
  'Design',
  'Marketing',
  'Finance',
  'Education',
  'Research',
  'Data Science',
  'Web Development',
  'Mobile Development'
]

const fieldOptions = [
  'Computer Science',
  'Engineering',
  'Medicine',
  'Business',
  'Arts',
  'Science',
  'Mathematics',
  'Law',
  'Education',
  'Other'
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    userType: '',
    fieldOfStudy: '',
    profession: '',
    interests: []
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail')
    if (!savedEmail) {
      router.push('/auth')
      return
    }

    // Load existing profile
    const users = JSON.parse(localStorage.getItem('users') || '{}')
    const userData = users[savedEmail.toLowerCase()]
    if (userData?.profile) {
      setProfile(userData.profile)
    }
  }, [router])

  const handleSave = () => {
    const savedEmail = localStorage.getItem('userEmail')
    if (!savedEmail) return

    setLoading(true)

    const users = JSON.parse(localStorage.getItem('users') || '{}')
    if (!users[savedEmail.toLowerCase()]) {
      users[savedEmail.toLowerCase()] = {}
    }
    users[savedEmail.toLowerCase()].profile = profile
    localStorage.setItem('users', JSON.stringify(users))

    setLoading(false)
    alert('Profile saved successfully!')
  }

  const handleInterestChange = (interest: string, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Tell us about yourself</CardTitle>
            <CardDescription>
              This information helps us provide personalized post recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Type */}
            <div className="space-y-2">
              <Label htmlFor="userType">I am a:</Label>
              <Select
                value={profile.userType}
                onValueChange={(value: 'student' | 'employee') =>
                  setProfile(prev => ({ ...prev, userType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="employee">Employee/Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field of Study / Profession */}
            {profile.userType === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="fieldOfStudy">Field of Study:</Label>
                <Select
                  value={profile.fieldOfStudy}
                  onValueChange={(value) =>
                    setProfile(prev => ({ ...prev, fieldOfStudy: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {profile.userType === 'employee' && (
              <div className="space-y-2">
                <Label htmlFor="profession">Profession:</Label>
                <Input
                  id="profession"
                  value={profile.profession}
                  onChange={(e) => setProfile(prev => ({ ...prev, profession: e.target.value }))}
                  placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
                />
              </div>
            )}

            {/* Interests */}
            <div className="space-y-3">
              <Label>What types of posts interest you? (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map(interest => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={profile.interests.includes(interest)}
                      onCheckedChange={(checked) =>
                        handleInterestChange(interest, checked as boolean)
                      }
                    />
                    <Label htmlFor={interest} className="text-sm">{interest}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}