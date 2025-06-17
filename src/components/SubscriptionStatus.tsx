'use client';

import React, { useState, useEffect } from 'react';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { Card, CardBody, Chip, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Progress } from '@heroui/react';

interface SubscriptionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export default function SubscriptionStatus({ showDetails = true, compact = false }: SubscriptionStatusProps) {
  const { plan, maxLocations, maxShapes, isLoading } = useSubscriptionFeatures();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [currentLocationCount, setCurrentLocationCount] = useState(0);
  const [currentShapeCount, setCurrentShapeCount] = useState(0);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const [locationsResponse, shapesResponse] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/shapes')
        ]);

        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          setCurrentLocationCount(locationsData.locations?.length || 0);
        }

        if (shapesResponse.ok) {
          const shapesData = await shapesResponse.json();
          setCurrentShapeCount(shapesData.shapes?.length || 0);
        }
      } catch (err) {
        console.error('Failed to fetch usage:', err);
      }
    };

    fetchUsage();
  }, []);

  const getLocationUsagePercentage = () => {
    if (plan.features.maxLocations === -1) return 0;
    return (currentLocationCount / plan.features.maxLocations) * 100;
  };

  const getShapeUsagePercentage = () => {
    if (plan.features.maxShapes === -1) return 0;
    return (currentShapeCount / plan.features.maxShapes) * 100;
  };

  const getPlanColor = () => {
    switch (plan.id) {
      case 'pro': return 'success';
      case 'basic': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardBody className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Chip 
          size="sm" 
          variant="flat" 
          color={getPlanColor()}
          onClick={onOpen}
          className="cursor-pointer"
        >
          {plan.name} Plan
        </Chip>
        
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Subscription Details</ModalHeader>
            <ModalBody>
              <SubscriptionStatus showDetails={true} compact={false} />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardBody className="p-4 space-y-4">
        {/* Plan Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {plan.id === 'pro' ? '🚀' : plan.id === 'basic' ? '📊' : '🆓'}
            </span>
            <div>
              <h3 className="font-semibold">{plan.name} Plan</h3>
              <p className="text-sm text-default-500">
                {plan.id === 'free' 
                  ? 'Limited features' 
                  : plan.id === 'basic' 
                    ? 'Essential features' 
                    : 'All features included'
                }
              </p>
            </div>
          </div>
          
          {plan.id === 'free' && (
            <Button 
              size="sm" 
              color="primary" 
              variant="flat"
              onPress={() => window.open('/pricing', '_blank')}
            >
              Upgrade
            </Button>
          )}
        </div>

        {showDetails && (
          <>
            {/* Usage Statistics */}
            <div className="space-y-3">
              {/* Locations */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Locations</span>
                  <span className="text-sm text-default-500">
                    {currentLocationCount}/{maxLocations}
                  </span>
                </div>
                {plan.features.maxLocations !== -1 && (
                  <Progress 
                    value={getLocationUsagePercentage()} 
                    color={getLocationUsagePercentage() > 90 ? 'danger' : getLocationUsagePercentage() > 70 ? 'warning' : 'success'}
                    size="sm"
                  />
                )}
              </div>

              {/* Shapes */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Shapes</span>
                  <span className="text-sm text-default-500">
                    {currentShapeCount}/{plan.features.maxShapes === -1 ? 'Unlimited' : plan.features.maxShapes}
                  </span>
                </div>
                {plan.features.maxShapes !== -1 && (
                  <Progress 
                    value={getShapeUsagePercentage()} 
                    color={getShapeUsagePercentage() > 90 ? 'danger' : getShapeUsagePercentage() > 70 ? 'warning' : 'success'}
                    size="sm"
                  />
                )}
              </div>

              {/* Storage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-sm text-default-500">
                    {plan.features.storageGB}GB
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Features</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span>{plan.features.advancedDrawingTools ? '✅' : '❌'}</span>
                  <span>Advanced Drawing</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{plan.features.spatialAnalysis ? '✅' : '❌'}</span>
                  <span>Spatial Analysis</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{plan.features.exportFeatures ? '✅' : '❌'}</span>
                  <span>Export Features</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{plan.features.prioritySupport ? '✅' : '❌'}</span>
                  <span>Priority Support</span>
                </div>
              </div>
            </div>

            {/* Warning if approaching limits */}
            {((plan.features.maxLocations !== -1 && getLocationUsagePercentage() > 80) ||
              (plan.features.maxShapes !== -1 && getShapeUsagePercentage() > 80)) && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-warning-700">
                  <span>⚠️</span>
                  <span className="text-sm font-medium">Approaching Limits</span>
                </div>
                <p className="text-xs text-warning-600 mt-1">
                  You're approaching your plan limits. Consider upgrading to avoid interruptions.
                </p>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
} 