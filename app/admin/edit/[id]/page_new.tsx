"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import ImagePicker from "@/components/ui/ImagePicker";
import { ArrowLeft, ArrowRight, Check, Award, X } from "lucide-react";

interface ChallengeInput {
  title: string;
  description: string;
  difficulty: string;
  cadence: string;
  proofType: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  rewards?: Array<{ place: number; title: string; desc: string }>;
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
    proofType: "PHOTO",
    startAt: toLocal(new Date()),
    endAt: toLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    imageUrl: "",
    rewards: []
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/c/${data.id}`);
      } else {
        console.error("Failed to create challenge");
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
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
    const arr = [...(form.rewards ?? [])];
    if (arr.length >= 3) return;
    arr.push({ place: arr.length + 1, title: "", desc: "" });
    setForm({ ...form, rewards: arr });
  };

  const removeReward = (index: number) => {
    const arr = [...(form.rewards ?? [])];
    arr.splice(index, 1);
    // Reorder places
    arr.forEach((r, i) => r.place = i + 1);
    setForm({ ...form, rewards: arr });
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
        <p className="text-gray-600">Step {step} of 5</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
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
            {i < 5 && (
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

          {/* Step 2: Proof Requirements */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Proof Requirements</h2>
              
              <div>
                <label className="block text-sm font-medium mb-3">What type of proof do participants need to submit?</label>
                <div className="space-y-3">
                  <label className="group flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="proofType"
                      value="PHOTO"
                      checked={form.proofType === "PHOTO"}
                      onChange={(e) => setForm({ ...form, proofType: e.target.value })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-white group-hover:text-gray-700">File Proof</div>
                      <div className="text-sm text-gray-600">Participants must upload files (images, videos, PDFs)</div>
                    </div>
                  </label>
                  
                  <label className="group flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="proofType"
                      value="LINK"
                      checked={form.proofType === "LINK"}
                      onChange={(e) => setForm({ ...form, proofType: e.target.value })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-white group-hover:text-gray-700">Link Proof</div>
                      <div className="text-sm text-gray-600">Participants must submit URLs or external links</div>
                    </div>
                  </label>
                </div>

                {/* Helpful information based on selected proof type */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  {form.proofType === "PHOTO" && (
                    <div className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Perfect for visual challenges like fitness progress, cooking, or creative projects. Participants can upload images, videos, or PDF documents.
                    </div>
                  )}
                  {form.proofType === "LINK" && (
                    <div className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Best for challenges involving online content like sharing social media posts, blog articles, or portfolio work.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Schedule & Timing</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Challenge Cadence</label>
                <Select
                  value={form.cadence}
                  onChange={(e) => setForm({ ...form, cadence: e.target.value })}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="CUSTOM">Custom</option>
                </Select>
              </div>

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

          {/* Step 4: Rewards & Incentives */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Rewards & Incentives</h2>
              
              <div className="space-y-4">
                <div className="font-medium inline-flex items-center gap-2">
                  <Award className="h-4 w-4"/> 
                  Rewards (up to 3 places)
                </div>
                
                <div className="space-y-3">
                  {(form.rewards ?? []).map((reward, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-700">Place {reward.place}</div>
                        <button
                          type="button"
                          onClick={() => removeReward(i)}
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
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Challenge Image (optional)</label>
                <ImagePicker
                  value={form.imageUrl}
                  onChange={(url: string | undefined) => setForm({ ...form, imageUrl: url || "" })}
                />
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Review & Create</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2 text-black">Challenge Details</h3>
                  <p className="text-black"><strong>Title:</strong> {form.title}</p>
                  <p className="text-black"><strong>Description:</strong> {form.description}</p>
                  <p className="text-black"><strong>Difficulty:</strong> {form.difficulty}</p>
                  <p className="text-black"><strong>Cadence:</strong> {form.cadence}</p>
                  <p className="text-black"><strong>Proof Type:</strong> {
                    form.proofType === "PHOTO" ? "File Proof" :
                    form.proofType === "LINK" ? "Link Proof" : form.proofType
                  }</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2 text-black">Schedule</h3>
                  <p className="text-black"><strong>Start:</strong> {new Date(form.startAt).toLocaleString()}</p>
                  <p className="text-black"><strong>End:</strong> {new Date(form.endAt).toLocaleString()}</p>
                </div>

                {form.imageUrl && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2 text-black">Challenge Image</h3>
                    <img src={form.imageUrl} alt="Challenge" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}

                {(form.rewards?.length ?? 0) > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2 text-black">Rewards</h3>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {form.rewards!.map(r => (
                        <li key={r.place} className="text-black">
                          <strong>#{r.place}</strong> — {r.title}
                          {r.desc && ` — ${r.desc}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
