import { useState } from 'react';

export const PipelineSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPipeline = async (nodes, edges) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

  };

  return { submitPipeline, isSubmitting };
};