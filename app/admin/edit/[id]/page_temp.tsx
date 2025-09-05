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
    rewards: [],
    policy: ""
  });

  const handleSubmit = async () => {
    // Convert to the correct schema format
    const challengeData: Partial<ChallengeAdminInput> = {
      title: form.title,
      description: form.description,
      startAt: new Date(form.startAt),
      endAt: new Date(form.endAt),
      proofType: form.proofType as "TEXT" | "PHOTO" | "LINK",
      cadence: form.cadence as "DAILY" | "END_OF_CHALLENGE",
      maxParticipants: form.maxParticipants,
      rewards: form.rewards,
      policy: form.policy,
      imageUrl: form.imageUrl,
      difficulty: form.difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    };

    // Validate using the schema
    const parsed = challengeAdminSchema.safeParse(challengeData);
    if (!parsed.success) {
      alert(parsed.error.errors[0].message);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challengeData)
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/c/${data.id}`);
      } else {
        const errorData = await response.json();
        console.error("Failed to create challenge:", errorData);
        alert(`Failed to create challenge: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </button>
        <h1 className="text-2xl font-bold">Create New Challenge</h1>
        <p className="text-gray-600">Step {step} of 6</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i}
            </div>
            {i < 6 && (
              <div
                className={`w-12 h-1 ${
                  i < step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
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

          {/* Step 3: Image & Policy */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Image & Policy</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Challenge Image</label>
                <ImagePicker
                  value={form.imageUrl || ""}
                  onChange={(url) => setForm({ ...form, imageUrl: url || "" })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Challenge Policy (optional)</label>
                <Textarea
                  value={form.policy || ""}
                  onChange={(e) => setForm({ ...form, policy: e.target.value })}
                  placeholder="Rules, terms, or additional information..."
                  rows={4}
                />
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

          {/* Step 5: Rewards */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Rewards & Incentives</h2>
              
              <div className="space-y-4">
                {(form.rewards ?? []).map((reward, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Place {reward.place} Reward</h3>
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
                  Add Reward
                </Button>
              )}

              {(form.rewards?.length ?? 0) === 0 && (
                <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded-lg">
                  <strong>💡 Tip:</strong> Adding rewards can significantly increase participation! Consider prizes like gift cards, products, or recognition.
                </div>
              )}
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Review & Create</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2 text-black">Challenge Details</h3>
                  <p className="text-black"><strong>Title:</strong> {form.title}</p>
                  <p className="text-black"><strong>Description:</strong> {form.description}</p>
                  <p className="text-black"><strong>Difficulty:</strong> {form.difficulty}</p>
                  <p className="text-black"><strong>Proof Type:</strong> {form.proofType}</p>
                  <p className="text-black"><strong>Cadence:</strong> {form.cadence}</p>
                  {form.maxParticipants && (
                    <p className="text-black"><strong>Max Participants:</strong> {form.maxParticipants}</p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2 text-black">Schedule</h3>
                  <p className="text-black"><strong>Start:</strong> {new Date(form.startAt).toLocaleString()}</p>
                  <p className="text-black"><strong>End:</strong> {new Date(form.endAt).toLocaleString()}</p>
                </div>

                {form.rewards && form.rewards.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2 text-black">Rewards</h3>
                    {form.rewards.map((reward) => (
                      <p key={reward.place} className="text-black">
                        <strong>#{reward.place}:</strong> {reward.title}
                        {reward.desc && <span className="text-gray-600"> - {reward.desc}</span>}
                      </p>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2 text-black">Visual & Policy</h3>
                  {form.imageUrl ? (
                    <div className="mb-2">
                      <img src={form.imageUrl} alt="Challenge" className="w-32 h-32 object-cover rounded-lg mb-2" />
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-2">No image uploaded</p>
                  )}
                  {form.policy && (
                    <p className="text-black text-sm"><strong>Policy:</strong> {form.policy}</p>
                  )}
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

            {step < 6 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || !form.title || !form.description}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? "Creating..." : "Create Challenge"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
