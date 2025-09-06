"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import ImagePicker from "@/components/ui/ImagePicker";
import { ArrowLeft, ArrowRight, Check, X, Award } from "lucide-react";
import { challengeAdminSchema, type ChallengeAdminInput } from "@/lib/adminSchema";
import { DEFAULT_POLICY_TEXT, POLICY_PLACEHOLDER } from "@/lib/defaultTexts";

interface ChallengeInput {
  title: string;
  description: string;
  difficulty: string;
  cadence: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  proofType: string;
  maxParticipants?: number;
  rewards?: Array<{ place: number; title: string; desc?: string }>;
  policy?: string;
}

function toLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewChallengePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ChallengeInput>({
    title: "",
    description: "",
    difficulty: "BEGINNER",
    cadence: "DAILY",
    startAt: toLocal(new Date()),
    endAt: toLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    imageUrl: "",
    proofType: "TEXT",
    maxParticipants: undefined,
    rewards: [{ place: 1, title: "", desc: "" }], // Start with one required reward
    policy: DEFAULT_POLICY_TEXT
  });

  const handleSubmit = async () => {
    // Convert to the correct schema format with proper JSON serialization
    const challengeData = {
      title: form.title,
      description: form.description,
      startAt: new Date(form.startAt), // Convert to Date for validation
      endAt: new Date(form.endAt), // Convert to Date for validation
      proofType: form.proofType as "TEXT" | "PHOTO" | "LINK",
      cadence: form.cadence as "DAILY" | "END_OF_CHALLENGE",
      maxParticipants: form.maxParticipants,
      rewards: form.rewards,
      policy: form.policy,
      imageUrl: form.imageUrl,
      difficulty: form.difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" || undefined
    };

    console.log("Submitting challenge data:", challengeData);

    // Validate using the schema
    const parsed = challengeAdminSchema.safeParse(challengeData);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      alert(`Validation error: ${parsed.error.errors[0].message}`);
      return;
    }

    // Convert dates back to strings for JSON serialization
    const challengeDataForAPI = {
      ...challengeData,
      startAt: form.startAt, // Send as ISO string
      endAt: form.endAt, // Send as ISO string
      whopCategoryName: form.difficulty || "General" // Add this for backend
    };

    setSaving(true);
    try {
      console.log("🚀 Sending request to API...");
      
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challengeDataForAPI)
      });

      console.log("📡 Response received:", response.status, response.statusText);
      
      // Get response text first for debugging
      const responseText = await response.text();
      console.log("📄 Response text:", responseText);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError);
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 200)}`);
      }
      
      if (response.ok) {
        console.log("✅ Challenge created successfully:", data);
        
        if (data.challenge && data.challenge.id) {
          router.push(`/admin`);
        } else {
          alert("Challenge created successfully!");
          router.push("/admin");
        }
      } else {
        const errorMessage = data.error || data.message || 'Unknown error';
        console.error("❌ Failed to create challenge:", errorMessage);
        console.error("❌ Full error response:", data);
        console.error("❌ Response status:", response.status);
        console.error("❌ Response headers:", Object.fromEntries(response.headers.entries()));
        alert(`Failed to create challenge: ${errorMessage}`);
      }
    } catch (error) {
      console.error("💥 Error creating challenge:", error);
      alert(`Error creating challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const addReward = () => {
    const existingPlaces = form.rewards?.map(r => r.place) ?? [];
    const nextPlace = [1, 2, 3].find(p => !existingPlaces.includes(p));
    if (nextPlace && (form.rewards?.length ?? 0) < 3) {
      setForm({
        ...form,
        rewards: [...(form.rewards ?? []), { place: nextPlace, title: "", desc: "" }]
      });
    }
  };

  const canSubmit = form.title && form.description && (form.rewards?.length ?? 0) > 0 && 
    form.rewards?.every(r => r.title.trim()) && form.policy && form.policy.length >= 10;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </button>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create New Challenge</h1>
            <p className="text-muted">Step {step} of 5</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i <= step
                      ? "bg-brand text-white"
                      : "bg-panel border border-border text-muted"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i}
                </div>
                {i < 5 && (
                  <div
                    className={`w-16 h-1 rounded-full transition-colors ${
                      i < step ? "bg-brand" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-panel/50 backdrop-blur-sm">
        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Challenge Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="30-Day Fitness Challenge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Transform your fitness in 30 days..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <Select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Proof & Settings */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Proof & Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Proof Type</label>
                  <Select
                    value={form.proofType}
                    onChange={(e) => setForm({ ...form, proofType: e.target.value })}
                  >
                    <option value="TEXT">Text</option>
                    <option value="PHOTO">Photo</option>
                    <option value="LINK">Link</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Challenge Cadence</label>
                  <Select
                    value={form.cadence}
                    onChange={(e) => setForm({ ...form, cadence: e.target.value })}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="END_OF_CHALLENGE">End of Challenge</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Participants (optional)</label>
                <Input
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={form.maxParticipants || ""}
                  onChange={(e) => setForm({ 
                    ...form, 
                    maxParticipants: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Image Upload */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Challenge Image</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Challenge Image</label>
                <ImagePicker
                  value={form.imageUrl || ""}
                  onChange={(url) => setForm({ ...form, imageUrl: url || "" })}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Choose an engaging image that represents your challenge. This will be displayed wherever your challenge appears.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Schedule & Timing</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Rewards & Policy */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Rewards & Terms</h2>
              
              {/* Rewards Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Rewards & Incentives</h3>
                  <span className="text-sm text-red-600 font-medium">* Required</span>
                </div>
                
                <div className="space-y-4">
                  {(form.rewards ?? []).map((reward, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Place {reward.place} Reward</h4>
                        {(form.rewards?.length ?? 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...(form.rewards ?? [])];
                              arr.splice(i, 1);
                              setForm({ ...form, rewards: arr });
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          placeholder="Reward title (e.g., $100 Gift Card)"
                          value={reward.title}
                          onChange={(e) => {
                            const arr = [...(form.rewards ?? [])];
                            arr[i] = { ...arr[i], title: e.target.value };
                            setForm({ ...form, rewards: arr });
                          }}
                          required
                        />
                        <Textarea
                          rows={2}
                          placeholder="Reward description (optional)"
                          value={reward.desc || ""}
                          onChange={(e) => {
                            const arr = [...(form.rewards ?? [])];
                            arr[i] = { ...arr[i], desc: e.target.value };
                            setForm({ ...form, rewards: arr });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {(form.rewards?.length ?? 0) < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addReward}
                    className="w-full"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Add Additional Reward
                  </Button>
                )}

                <div className="text-sm text-orange-600 p-4 bg-orange-50 rounded-lg">
                  <strong>⚠️ Important:</strong> At least one reward is required to create a challenge. This increases engagement and protects participants by clearly stating what they can win.
                </div>
              </div>

              {/* Policy Section */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Challenge Terms & Policy</h3>
                  <span className="text-sm text-red-600 font-medium">* Required</span>
                </div>
                
                <div>
                  <Textarea
                    value={form.policy || ""}
                    onChange={(e) => setForm({ ...form, policy: e.target.value })}
                    placeholder={POLICY_PLACEHOLDER}
                    rows={8}
                    required
                    className="text-sm"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-600">
                      This protects both you and participants by clearly stating rules and legal requirements.
                    </p>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, policy: DEFAULT_POLICY_TEXT })}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Use Default Template
                    </button>
                  </div>
                </div>

                <div className="text-sm text-blue-600 p-4 bg-blue-50 rounded-lg">
                  <strong>💡 Legal Protection:</strong> A clear policy protects you from disputes and ensures participants understand the rules, winner selection process, and their obligations.
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {step < 5 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || !canSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? "Creating..." : "Create Challenge"}
              </Button>
            )}
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}
