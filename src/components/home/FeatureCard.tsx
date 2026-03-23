import React from 'react';

interface FeatureCardProps {
  icon: string;
  label: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, label, description }) => {
  return (
    <div className="flex items-center gap-5 bg-white/60 backdrop-blur-md border border-[#C8DEC4]/60 
      rounded-2xl px-6 py-5 text-left shadow-sm hover:shadow-md transition-shadow">
      <span className="text-3xl shrink-0">{icon}</span>
      <div>
        <p className="font-medium text-primary-green text-base">{label}</p>
        <p className="text-[#6a6a6a] text-sm mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
