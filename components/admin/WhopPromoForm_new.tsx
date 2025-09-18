'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { Percent, DollarSign, Tag, Users, Clock, CalendarIcon } from 'lucide-react';

interface WhopPlan {
  id: string;
  name: string;
  title: string;
  visibility?: string;
  initial_price?: number;
  base_currency?: string;
  plan_type?: string;
}

interface WhopPromoFormProps {
  type: 'completion' | 'mid_challenge';
  plans: WhopPlan[];
  challengeId: string;
  participantCount?: number;
  onSuccess: (promoCode: any) => void;
  onError: (error: string) => void;
}

export default function WhopPromoForm({ 
  type, 
  plans, 
  challengeId, 
  participantCount = 100,
  onSuccess, 
  onError 
}: WhopPromoFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Settings
    code: '',
    discount_type: 'percentage' as 'percentage' | 'flat_amount',
    discount_value: type === 'completion' ? 50 : 25,
    
    // Plan Selection
    planId: '',
    
    // Duration Settings (Whop UI fields)
    duration: 'one-time' as 'one-time' | 'forever' | 'multiple_months',
    number_of_intervals: 3,
    
    // User Restrictions (Whop UI fields)
    eligible_users: 'everyone' as 'everyone' | 'only_new' | 'only_churned',
    
    // Expiration (Whop UI fields)
    has_expiration: type === 'mid_challenge', // Mid-challenge expires with challenge
    expiration_date: '',
    
    // Usage Limits (Whop UI fields)
    usage_limit: type === 'completion' ? Math.ceil(participantCount * 0.1) : 999,
    one_per_customer: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.planId || !formData.discount_value) {
      onError('Please select a product and enter a discount value');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/marketing-monetization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          offerType: type,
          planId: formData.planId,
          discountPercentage: formData.discount_value,
          promoCode: formData.code || `${type.toUpperCase()}_SAVE${formData.discount_value}`,
          // Add other relevant fields
          timeLimit: formData.has_expiration ? formData.expiration_date : null,
          customMessage: `${formData.discount_value}% off for ${type === 'completion' ? 'completing' : 'participating in'} the challenge!`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create promo code');
      }

      const result = await response.json();
      onSuccess(result.promoCode);
      
      // Reset form
      setFormData({
        ...formData,
        code: '',
        planId: '',
      });

    } catch (error) {
      console.error('Error creating promo code:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {type === 'completion' ? (
            <>
              <Tag className="h-5 w-5 text-green-600" />
              Challenge Completion Offer
            </>
          ) : (
            <>
              <Tag className="h-5 w-5 text-blue-600" />
              Mid-Challenge Boost Offer
            </>
          )}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {type === 'completion' 
            ? 'Reward participants who complete the challenge'
            : 'Motivate participants during the challenge'
          }
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Settings Section */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Promo Code Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code (optional)</label>
              <Input
                placeholder={`${type.toUpperCase()}_SAVE${formData.discount_value}`}
                value={formData.code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('code', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave empty to auto-generate
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select 
                value={formData.planId} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFormData('planId', e.target.value)}
              >
                <option value="">Select plan...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  value={formData.discount_value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('discount_value', parseInt(e.target.value))}
                />
                <Select
                  value={formData.discount_type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFormData('discount_type', e.target.value)}
                  className="w-32"
                >
                  <option value="percentage">%</option>
                  <option value="flat_amount">$</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Duration Settings Section */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Discount Duration
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="one-time"
                name="duration"
                checked={formData.duration === 'one-time'}
                onChange={() => updateFormData('duration', 'one-time')}
                className="w-4 h-4"
              />
              <label htmlFor="one-time" className="text-sm">One-time (default)</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="forever"
                name="duration"
                checked={formData.duration === 'forever'}
                onChange={() => updateFormData('duration', 'forever')}
                className="w-4 h-4"
              />
              <label htmlFor="forever" className="text-sm">Forever</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="multiple-months"
                name="duration"
                checked={formData.duration === 'multiple_months'}
                onChange={() => updateFormData('duration', 'multiple_months')}
                className="w-4 h-4"
              />
              <label htmlFor="multiple-months" className="text-sm">Multiple months</label>
              {formData.duration === 'multiple_months' && (
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.number_of_intervals}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('number_of_intervals', parseInt(e.target.value))}
                  className="w-20 ml-2"
                />
              )}
            </div>
          </div>
        </div>

        {/* User Restrictions Section */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Eligible Users
          </h4>
          
          <Select
            value={formData.eligible_users}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFormData('eligible_users', e.target.value)}
          >
            <option value="everyone">Everyone (default)</option>
            <option value="only_new">Only new customers</option>
            <option value="only_churned">Only churned customers</option>
          </Select>
        </div>

        {/* Expiration Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Expiration
          </h4>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="has-expiration"
              checked={formData.has_expiration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('has_expiration', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="has-expiration" className="text-sm">Set expiration date</label>
          </div>
          
          {formData.has_expiration && (
            <Input
              type="datetime-local"
              value={formData.expiration_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('expiration_date', e.target.value)}
            />
          )}
        </div>

        {/* Usage Limits */}
        <div className="space-y-4">
          <h4 className="font-medium">Usage Limits</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum uses</label>
              <Input
                type="number"
                min="1"
                value={formData.usage_limit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('usage_limit', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                {type === 'completion' 
                  ? `Recommended: ${Math.ceil(participantCount * 0.1)} (10% of participants)`
                  : 'For mid-challenge boosts, higher limits encourage participation'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="one-per-customer"
              checked={formData.one_per_customer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('one_per_customer', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="one-per-customer" className="text-sm">One per customer</label>
          </div>
        </div>

        {/* Challenge-specific Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Challenge Integration
          </h5>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            {type === 'completion' ? (
              <>
                <li>• Automatically given to challenge winners</li>
                <li>• Limited stock based on participant count</li>
                <li>• One-time reward for achievement</li>
              </>
            ) : (
              <>
                <li>• Available to active participants</li>
                <li>• Motivates continued engagement</li>
                <li>• Expires when challenge ends</li>
              </>
            )}
            <li>• Tracked in challenge analytics</li>
            <li>• Personalized codes for each user</li>
          </ul>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={loading || !formData.planId || !formData.discount_value}
          className="w-full"
        >
          {loading ? 'Creating...' : 
           type === 'completion' ? 'Create Completion Offer' : 'Create Mid-Challenge Boost'
          }
        </Button>
      </form>
    </Card>
  );
}