"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus, ExternalLink, Settings, RefreshCw } from 'lucide-react';

interface CreatorProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  type: string;
  imageUrl?: string;
  checkoutUrl: string;
  isActive: boolean;
}

interface WhopProductManagerProps {
  challengeId: string;
  onProductSelected?: (productId: string) => void;
}

export default function WhopProductManager({ challengeId, onProductSelected }: WhopProductManagerProps) {
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dataSource, setDataSource] = useState<'whop_api' | 'demo_data'>('demo_data');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadCreatorProducts();
  }, [challengeId]);

  const loadCreatorProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/marketing-monetization?challengeId=${challengeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setDataSource(data.source);
        setMessage(data.message || '');
        console.log(`✅ Loaded ${data.products?.length || 0} products from ${data.source}`);
      } else {
        console.error('Failed to load products:', await response.text());
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading creator products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const syncWithWhop = async () => {
    setLoading(true);
    // Force refresh from Whop API
    await loadCreatorProducts();
    setLoading(false);
  };

  const connectWhopAccount = () => {
    // This would redirect to Whop OAuth flow
    window.open('https://whop.com/oauth/authorize?client_id=your_client_id', '_blank');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Whop Products
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select products to use in special offers for this challenge
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={syncWithWhop}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync
            </Button>
            
            {dataSource === 'demo_data' && (
              <Button
                onClick={connectWhopAccount}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Whop
              </Button>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              dataSource === 'whop_api' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {dataSource === 'whop_api' 
                ? 'Connected to your Whop products' 
                : 'Using demo products - Connect your Whop account to load real products'
              }
            </span>
          </div>
          {message && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{message}</p>
          )}
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col h-full">
              {/* Product Image */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h3>
                
                {product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-green-600">
                    ${product.price} {product.currency}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {product.type}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onProductSelected?.(product.id)}
                  className="flex-1"
                >
                  Use in Offer
                </Button>
                
                <Button
                  onClick={() => window.open(product.checkoutUrl, '_blank')}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="p-12 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Products Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your Whop account to load your products, or create products on Whop first.
          </p>
          <Button onClick={connectWhopAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Whop Account
          </Button>
        </Card>
      )}

      {/* Product Management Modal */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Manage Whop Products"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Product management coming soon. For now, manage your products directly on Whop.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={() => window.open('https://whop.com/dashboard', '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Whop Dashboard
              </Button>
              
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
