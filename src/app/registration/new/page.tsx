'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  Camera,
  Fingerprint,
  Eye,
  MapPin,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Upload,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  createVoterRegistration,
  getProvinces,
  getDistricts,
  generateVoterId,
  type Province,
  type District,
} from '@/lib/data-service';

interface FormData {
  // Personal Information
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  marital_status: string;
  occupation: string;
  phone_number: string;
  email: string;

  // Location Details
  province_id: string;
  district_id: string;
  llg_id: string;
  ward_id: string;
  village_locality: string;
  street_address: string;

  // GPS Coordinates
  gps_latitude: string;
  gps_longitude: string;
  gps_accuracy: string;

  // Biometric Data
  facial_image: File | null;
  facial_image_preview: string;
  fingerprints_captured: boolean;
  iris_captured: boolean;

  // Additional Information
  id_document_type: string;
  id_document_number: string;
  notes: string;
}

const STEPS = [
  { id: 1, name: 'Personal Info', icon: UserPlus, description: 'Basic information' },
  { id: 2, name: 'Location', icon: MapPin, description: 'Address and location' },
  { id: 3, name: 'Biometrics', icon: Fingerprint, description: 'Capture biometric data' },
  { id: 4, name: 'Review', icon: CheckCircle, description: 'Review and submit' },
];

const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated',
];

const ID_DOCUMENT_TYPES = [
  'National ID',
  'Passport',
  'Driver License',
  'Birth Certificate',
  'Other',
];

export default function NewVoterRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: 'male',
    marital_status: '',
    occupation: '',
    phone_number: '',
    email: '',
    province_id: '',
    district_id: '',
    llg_id: '',
    ward_id: '',
    village_locality: '',
    street_address: '',
    gps_latitude: '',
    gps_longitude: '',
    gps_accuracy: '',
    facial_image: null,
    facial_image_preview: '',
    fingerprints_captured: false,
    iris_captured: false,
    id_document_type: '',
    id_document_number: '',
    notes: '',
  });

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (formData.province_id) {
      loadDistricts(formData.province_id);
    } else {
      setDistricts([]);
    }
  }, [formData.province_id]);

  const loadProvinces = async () => {
    setLoading(true);
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
      toast({
        title: 'Error',
        description: 'Failed to load provinces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (provinceId: string) => {
    try {
      const data = await getDistricts(provinceId);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const captureGPSLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          gps_latitude: position.coords.latitude.toString(),
          gps_longitude: position.coords.longitude.toString(),
          gps_accuracy: position.coords.accuracy.toString(),
        });
        setCapturingLocation(false);
        toast({
          title: 'Location Captured',
          description: `Latitude: ${position.coords.latitude.toFixed(6)}, Longitude: ${position.coords.longitude.toFixed(6)}`,
        });
      },
      (error) => {
        setCapturingLocation(false);
        toast({
          title: 'Error',
          description: 'Failed to capture GPS location',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          facial_image: file,
          facial_image_preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.first_name &&
          formData.last_name &&
          formData.date_of_birth &&
          formData.gender
        );
      case 2:
        return !!(
          formData.province_id &&
          formData.district_id &&
          formData.village_locality
        );
      case 3:
        return true; // Biometrics are optional but recommended
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields before continuing',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast({
        title: 'Incomplete Information',
        description: 'Please complete all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const province = provinces.find(p => p.id === formData.province_id);
      const voterId = generateVoterId(province?.code || 'PNG');

      const registrationData = {
        voter_id: voterId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || undefined,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        province_id: formData.province_id || undefined,
        district_id: formData.district_id || undefined,
        village_locality: formData.village_locality || undefined,
        gps_latitude: formData.gps_latitude ? parseFloat(formData.gps_latitude) : undefined,
        gps_longitude: formData.gps_longitude ? parseFloat(formData.gps_longitude) : undefined,
      };

      const result = await createVoterRegistration(registrationData);

      if (result) {
        toast({
          title: 'Success',
          description: `Voter registration created successfully. Voter ID: ${voterId}`,
        });
        router.push('/registration');
      }
    } catch (error) {
      console.error('Error creating registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to create voter registration',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/registration')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">New Voter Registration</h1>
              <p className="text-sm text-slate-500">
                Complete all steps to register a new voter
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {currentStep} of {STEPS.length}
          </Badge>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-1 flex-col items-center">
                  <div
                    className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                      currentStep > step.id
                        ? 'bg-emerald-600 text-white'
                        : currentStep === step.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-slate-400">{step.description}</p>
                  {index < STEPS.length - 1 && (
                    <div className="absolute mt-5 h-0.5 w-full bg-slate-200" />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Enter the voter's basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name (Optional)</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  placeholder="Enter middle name"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value as 'male' | 'female' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status.toLowerCase()}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Enter occupation"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+675 XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Required Fields</p>
                    <p className="text-sm text-blue-700">
                      Fields marked with <span className="text-red-500">*</span> are required to
                      continue
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                Enter the voter's address and capture GPS coordinates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province">
                    Province <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.province_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, province_id: value, district_id: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">
                    District <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.district_id}
                    onValueChange={(value) => setFormData({ ...formData, district_id: value })}
                    disabled={!formData.province_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="village_locality">
                  Village/Locality <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="village_locality"
                  value={formData.village_locality}
                  onChange={(e) => setFormData({ ...formData, village_locality: e.target.value })}
                  placeholder="Enter village or locality name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street_address">Street Address</Label>
                <Textarea
                  id="street_address"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  placeholder="Enter street address or directions"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>GPS Coordinates</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={captureGPSLocation}
                    disabled={capturingLocation}
                  >
                    {capturingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Capture Location
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-sm">
                      Latitude
                    </Label>
                    <Input
                      id="latitude"
                      value={formData.gps_latitude}
                      onChange={(e) => setFormData({ ...formData, gps_latitude: e.target.value })}
                      placeholder="0.000000"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-sm">
                      Longitude
                    </Label>
                    <Input
                      id="longitude"
                      value={formData.gps_longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, gps_longitude: e.target.value })
                      }
                      placeholder="0.000000"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accuracy" className="text-sm">
                      Accuracy (m)
                    </Label>
                    <Input
                      id="accuracy"
                      value={formData.gps_accuracy}
                      placeholder="0"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">GPS Capture</p>
                    <p className="text-sm text-amber-700">
                      Click "Capture Location" to automatically record GPS coordinates
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Biometric Capture */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Biometric Data Capture</CardTitle>
              <CardDescription>
                Capture facial image, fingerprints, and iris data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Facial Image */}
              <div className="space-y-3">
                <Label>Facial Image</Label>
                <div className="flex items-center gap-4">
                  {formData.facial_image_preview ? (
                    <div className="relative">
                      <img
                        src={formData.facial_image_preview}
                        alt="Facial preview"
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                        onClick={() =>
                          setFormData({ ...formData, facial_image: null, facial_image_preview: '' })
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                      <Camera className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      id="facial_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('facial_image')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-slate-500">
                      Recommended: Clear front-facing photo with neutral expression
                    </p>
                  </div>
                </div>
              </div>

              {/* Fingerprints */}
              <div className="space-y-3">
                <Label>Fingerprints</Label>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            formData.fingerprints_captured
                              ? 'bg-emerald-100'
                              : 'bg-slate-100'
                          }`}
                        >
                          <Fingerprint
                            className={`h-6 w-6 ${
                              formData.fingerprints_captured
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Fingerprint Scanner</p>
                          <p className="text-sm text-slate-500">
                            {formData.fingerprints_captured
                              ? '10 fingerprints captured'
                              : 'No fingerprints captured'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant={formData.fingerprints_captured ? 'outline' : 'default'}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            fingerprints_captured: !formData.fingerprints_captured,
                          })
                        }
                      >
                        {formData.fingerprints_captured ? 'Recapture' : 'Capture'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Iris Scan */}
              <div className="space-y-3">
                <Label>Iris Scan</Label>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            formData.iris_captured ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}
                        >
                          <Eye
                            className={`h-6 w-6 ${
                              formData.iris_captured ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Iris Scanner</p>
                          <p className="text-sm text-slate-500">
                            {formData.iris_captured
                              ? 'Both eyes captured'
                              : 'No iris data captured'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant={formData.iris_captured ? 'outline' : 'default'}
                        onClick={() =>
                          setFormData({ ...formData, iris_captured: !formData.iris_captured })
                        }
                      >
                        {formData.iris_captured ? 'Recapture' : 'Capture'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Biometric Capture</p>
                    <p className="text-sm text-blue-700">
                      Biometric data helps prevent duplicate registrations and ensures voter
                      identity verification
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review and Submit */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review and Submit</CardTitle>
              <CardDescription>
                Review all information before submitting the registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information Summary */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Personal Information</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-slate-500">Full Name</Label>
                    <p className="font-medium">
                      {formData.first_name} {formData.middle_name} {formData.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Date of Birth</Label>
                    <p className="font-medium">{formData.date_of_birth}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Gender</Label>
                    <p className="font-medium capitalize">{formData.gender}</p>
                  </div>
                  {formData.marital_status && (
                    <div>
                      <Label className="text-xs text-slate-500">Marital Status</Label>
                      <p className="font-medium capitalize">{formData.marital_status}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Summary */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Location Details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-slate-500">Province</Label>
                    <p className="font-medium">
                      {provinces.find(p => p.id === formData.province_id)?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">District</Label>
                    <p className="font-medium">
                      {districts.find(d => d.id === formData.district_id)?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Village/Locality</Label>
                    <p className="font-medium">{formData.village_locality}</p>
                  </div>
                  {(formData.gps_latitude || formData.gps_longitude) && (
                    <div>
                      <Label className="text-xs text-slate-500">GPS Coordinates</Label>
                      <p className="font-medium font-mono text-sm">
                        {formData.gps_latitude}, {formData.gps_longitude}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Biometric Summary */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Biometric Data</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded ${
                        formData.facial_image_preview ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}
                    >
                      <Camera
                        className={`h-4 w-4 ${
                          formData.facial_image_preview ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <span className="text-sm">
                      {formData.facial_image_preview ? 'Photo captured' : 'No photo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded ${
                        formData.fingerprints_captured ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}
                    >
                      <Fingerprint
                        className={`h-4 w-4 ${
                          formData.fingerprints_captured ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <span className="text-sm">
                      {formData.fingerprints_captured ? 'Fingerprints captured' : 'No fingerprints'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded ${
                        formData.iris_captured ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}
                    >
                      <Eye
                        className={`h-4 w-4 ${
                          formData.iris_captured ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <span className="text-sm">
                      {formData.iris_captured ? 'Iris captured' : 'No iris data'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Ready to Submit</p>
                    <p className="text-sm text-emerald-700">
                      Click "Submit Registration" to complete the voter registration process
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Registration
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
