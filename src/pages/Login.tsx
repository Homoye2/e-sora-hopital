import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react'
import { authService } from '../services/api'
import logo from "../assets/e_sora.png"

export const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authService.login(formData.email, formData.password)
      
      // Stocker les tokens et les informations utilisateur
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Vérifier que l'utilisateur a le bon rôle
      if (!['admin_hopital', 'specialiste'].includes(response.user.role)) {
        setError('Accès réservé aux administrateurs d\'hôpital et aux spécialistes')
        authService.logout()
        return
      }
      
      // Rediriger vers le dashboard
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      if (error.response?.status === 401) {
        setError('Email ou mot de passe incorrect')
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Erreur de connexion. Veuillez réessayer.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full ">
                <img src={logo} alt="E-Sora" className="w-40 h-16" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              E-Sora Hôpital
            </CardTitle>
            <CardDescription className="text-gray-600">
              Connectez-vous à votre espace hôpital
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@hopital.sn"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Connexion...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Problème de connexion ?{' '}
                <a href="mailto:support@e-sora.sn" className="text-blue-600 hover:underline">
                  Contactez le support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2026 E-Sora. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}