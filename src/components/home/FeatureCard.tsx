import React from 'react';

interface FeatureCardProps {
  icon: string;
  label: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, label, description }) => {
  return (
    <div className="flex items-center gap-5 glass-card rounded-2xl px-6 py-5 text-left transition-all hover:scale-[1.02]">
      <span className="text-3xl shrink-0">{icon}</span>
      <div>
        <p className="font-bold text-primary text-base">{label}</p>
        <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
      </div>
    </div>
  );
};


export default FeatureCard;
