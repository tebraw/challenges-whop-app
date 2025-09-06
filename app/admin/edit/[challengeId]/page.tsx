"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Upload, X } from "lucide-react";

type ChallengeData = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  proofType: string;
  cadence: string;
  policy: string;
  imageUrl: string;
  rewards: Array<{
    place: number;
    title: string;
    description?: string;
  }>;
};

export default function EditChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState<ChallengeData>({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    proofType: "TEXT",
    cadence: "DAILY",
    policy: "",
    imageUrl: "",
    rewards: [{ place: 1, title: "", description: "" }]
  });

  // Load challenge data on mount
  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const resolvedParams = await params;
        setChallengeId(resolvedParams.challengeId);
        
        const response = await fetch(`/api/admin/challenges/${resolvedParams.challengeId}`);
        if (!response.ok) {
          throw new Error("Challenge not found");
        }
        
        const challenge = await response.json();
        
        // Set form values
        setFormData({
          title: challenge.title,
          description: challenge.description || "",
          startAt: new Date(challenge.startAt).toISOString().slice(0, 16),
          endAt: new Date(challenge.endAt).toISOString().slice(0, 16),
          proofType: challenge.proofType,
          cadence: challenge.cadence,
          policy: challenge.rules || challenge.policy || "", // Map rules to policy field
          imageUrl: challenge.imageUrl || "",
          rewards: challenge.rewards && challenge.rewards.length > 0 
            ? challenge.rewards.map((r: any) => ({
                place: r.place,
                title: r.title,
                description: r.description || ""
              }))
            : [{ place: 1, title: "", description: "" }],
        });
        
        if (challenge.imageUrl) {
          setImagePreview(challenge.imageUrl);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading challenge:", error);
        router.push("/admin");
      }
    };

    loadChallenge();
  }, [params, router]);

  const handleInputChange = (field: keyof ChallengeData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRewardChange = (index: number, field: string, value: string | number) => {
    const newRewards = [...formData.rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setFormData(prev => ({ ...prev, rewards: newRewards }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      alert("Die Datei ist zu groß. Maximale Größe: 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Bitte wählen Sie eine Bilddatei aus");
      return;
    }

    try {
      setUploadProgress(10);
      
      // Convert to data URL for small files
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(dataUrl);
        handleInputChange("imageUrl", dataUrl);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Fehler beim Hochladen des Bildes");
      setUploadProgress(0);
    }
  };

  const removeImage = () => {
    setImagePreview("");
    handleInputChange("imageUrl", "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update challenge");
      }

      const result = await response.json();
      
      // Redirect to admin page with success message
      router.push("/admin?updated=" + encodeURIComponent(result.challenge?.title || "Challenge"));
    } catch (error) {
      console.error("Error updating challenge:", error);
      alert("Fehler beim Speichern der Challenge: " + (error instanceof Error ? error.message : "Unbekannter Fehler"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Lade Challenge...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold">Challenge Bearbeiten</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Grundinformationen</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Challenge Titel *
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="z.B. 30-Tage Fitness Challenge"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Beschreibung *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none resize-vertical"
                  placeholder="Beschreibe deine Challenge..."
                  required
                />
              </div>
            </div>
          </Card>

          {/* Timing */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Zeitraum</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Datum & Zeit *
                </label>
                <input
                  value={formData.startAt}
                  onChange={(e) => handleInputChange("startAt", e.target.value)}
                  type="datetime-local"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  End Datum & Zeit *
                </label>
                <input
                  value={formData.endAt}
                  onChange={(e) => handleInputChange("endAt", e.target.value)}
                  type="datetime-local"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Challenge Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Challenge Einstellungen</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Beweis-Typ *
                </label>
                <select
                  value={formData.proofType}
                  onChange={(e) => handleInputChange("proofType", e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="TEXT">Text</option>
                  <option value="PHOTO">Bild</option>
                  <option value="VIDEO">Video</option>
                  <option value="LINK">Link</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Häufigkeit *
                </label>
                <select
                  value={formData.cadence}
                  onChange={(e) => handleInputChange("cadence", e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="DAILY">Täglich</option>
                  <option value="END_OF_CHALLENGE">Am Ende der Challenge</option>
                  <option value="WEEKLY">Wöchentlich</option>
                  <option value="ONCE">Einmalig</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Image Upload */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Challenge Bild</h2>
            
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Challenge Preview"
                    className="max-w-xs max-h-48 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bild hochladen (optional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Upload className="h-4 w-4" />
                    Bild auswählen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="text-sm text-blue-400">
                      Upload: {uploadProgress}%
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Maximale Größe: 2MB. Unterstützte Formate: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </Card>

          {/* Policy */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Regeln & Richtlinien</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Challenge Regeln (optional)
              </label>
              <textarea
                value={formData.policy}
                onChange={(e) => handleInputChange("policy", e.target.value)}
                rows={4}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none resize-vertical"
                placeholder="Beschreibe die Regeln und Richtlinien für deine Challenge..."
              />
            </div>
          </Card>

          {/* Rewards */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Belohnungen</h2>
            
            <div className="space-y-4">
              {formData.rewards.map((reward, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Platz
                    </label>
                    <input
                      value={reward.place}
                      onChange={(e) => handleRewardChange(index, "place", parseInt(e.target.value) || 1)}
                      type="number"
                      min="1"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Belohnung
                    </label>
                    <input
                      value={reward.title}
                      onChange={(e) => handleRewardChange(index, "title", e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="z.B. 100€ Gutschein"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Beschreibung
                    </label>
                    <input
                      value={reward.description || ""}
                      onChange={(e) => handleRewardChange(index, "description", e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Details zur Belohnung"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin")}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Speichere..." : "Challenge Speichern"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
