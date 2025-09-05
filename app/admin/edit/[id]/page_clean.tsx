"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Progress from "@/components/ui/Progress";
import CopyField from "@/components/ui/CopyField";
import ImagePicker from "@/components/ui/ImagePicker";
import { challengeAdminSchema, type ChallengeAdminInput } from "@/lib/adminSchema";
import { Calendar, Link2, Award, ShieldCheck } from "lucide-react";

type ChallengeFromApi = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  proofType: "TEXT" | "PHOTO" | "LINK";
  rules?: any;
};

function toLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditChallengePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ChallengeAdminInput | null>(null);

  const percent = [0, 25, 50, 75, 100][step];
  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 1));

  useEffect(() => {
    if (!id) return;

    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/admin/challenges/${id}`);
        if (!response.ok) throw new Error("Failed to fetch challenge");
        
        const challenge: ChallengeFromApi = await response.json();
        
        setForm({
          title: challenge.title,
          description: challenge.description || "",
          startAt: new Date(challenge.startAt),
          endAt: new Date(challenge.endAt),
          proofType: challenge.proofType === "LINK" ? "TEXT" : challenge.proofType,
          cadence: challenge.rules?.cadence || "DAILY",
          maxParticipants: challenge.rules?.maxParticipants || undefined,
          rewards: challenge.rules?.rewards || [],
          policy: challenge.rules?.policy || "",
          imageUrl: challenge.rules?.imageUrl || "",
        });
      } catch (error) {
        console.error("Error fetching challenge:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id]);

  const handleSubmit = async () => {
    if (!form || !id) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        startAt: form.startAt.toISOString(),
        endAt: form.endAt.toISOString(),
      };

      const response = await fetch(`/api/admin/challenges/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update challenge");

      router.push(`/admin/c/${id}`);
    } catch (error) {
      console.error("Error updating challenge:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Challenge not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Edit Challenge</h1>
        <p className="text-gray-600">Update your challenge settings in 4 simple steps</p>
        <div className="mt-4">
          <CopyField
            value={`${window.location.origin}/c/${id}`}
          />
        </div>
      </div>

      <Progress value={percent} className="mb-6" />

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {step === 1 && (
          <Card className="space-y-6">
            <div className="font-semibold inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Basic Information
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Challenge Title</label>
              <Input
                placeholder="30-Day Fitness Challenge"
                value={form.title}
                onChange={(e: any) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                placeholder="Transform your fitness routine with daily workouts..."
                value={form.description}
                onChange={(e: any) => setForm({ ...form, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="datetime-local"
                  value={toLocal(form.startAt)}
                  onChange={(e: any) => setForm({ ...form, startAt: new Date(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input
                  type="datetime-local"
                  value={toLocal(form.endAt)}
                  onChange={(e: any) => setForm({ ...form, endAt: new Date(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Challenge Image</label>
              <ImagePicker
                value={form.imageUrl}
                onChange={(url?: string) => setForm({ ...form, imageUrl: url || "" })}
              />
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-6">
            <div className="font-semibold inline-flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Challenge Settings
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Proof Type</label>
                <Select
                  value={form.proofType}
                  onChange={(e: any) => setForm({ ...form, proofType: e.target.value })}
                >
                  <option value="PHOTO">Photo Upload</option>
                  <option value="TEXT">Text Description</option>
                  <option value="BOTH">Photo + Text</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <Select
                  value={form.cadence}
                  onChange={(e: any) => setForm({ ...form, cadence: e.target.value })}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MILESTONE">Milestone Based</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Participants (Optional)</label>
              <Input
                type="number"
                placeholder="Leave empty for unlimited"
                value={form.maxParticipants || ""}
                onChange={(e: any) => setForm({ 
                  ...form, 
                  maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="space-y-6">
            <div className="font-semibold inline-flex items-center gap-2">
              <Award className="h-4 w-4" /> Rewards & Recognition
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">Current Rewards</h3>
                {form.rewards && form.rewards.length > 0 ? (
                  <div className="space-y-2">
                    {form.rewards.map((reward: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">#{reward.place}</span> - {reward.title}
                          {reward.description && (
                            <p className="text-sm text-gray-600">{reward.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const newRewards = [...(form.rewards || [])];
                            newRewards.splice(index, 1);
                            setForm({ ...form, rewards: newRewards });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No rewards added yet</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Add Reward</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((place) => {
                    const existingReward = form.rewards?.find((r: any) => r.place === place);
                    return (
                      <Button
                        key={place}
                        variant="outline"
                        onClick={() => {
                          const title = prompt(`Enter reward for place #${place}:`);
                          if (!title) return;
                          
                          const description = prompt("Enter reward description (optional):");
                          
                          const newReward = { place, title, description: description || "" };
                          const newRewards = [...(form.rewards || [])];
                          
                          if (existingReward) {
                            const index = newRewards.findIndex((r: any) => r.place === place);
                            newRewards[index] = newReward;
                          } else {
                            newRewards.push(newReward);
                          }
                          
                          setForm({ ...form, rewards: newRewards });
                        }}
                        disabled={!!existingReward}
                      >
                        {existingReward ? `#${place} Updated` : `Add #${place} Place`}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="space-y-6">
            <div className="font-semibold inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Terms & Conditions
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Challenge Rules & Policy</label>
              <Textarea
                placeholder="Enter the rules, terms, and conditions for this challenge..."
                value={form.policy}
                onChange={(e: any) => setForm({ ...form, policy: e.target.value })}
                rows={8}
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📋 Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Title:</strong> {form.title}</p>
                <p><strong>Duration:</strong> {form.startAt.toLocaleDateString()} - {form.endAt.toLocaleDateString()}</p>
                <p><strong>Proof Type:</strong> {form.proofType}</p>
                <p><strong>Frequency:</strong> {form.cadence}</p>
                <p><strong>Max Participants:</strong> {form.maxParticipants || "Unlimited"}</p>
                <p><strong>Rewards:</strong> {form.rewards?.length || 0} configured</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={back}
            disabled={step === 1}
          >
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Step {step} of 4
          </div>

          {step < 4 ? (
            <Button onClick={next}>
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.title || !form.description || !form.policy}
            >
              {saving ? "Saving..." : "Update Challenge"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
