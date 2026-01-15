// frontend/src/hooks/usePipelineSubmit.js
import { useState } from 'react';
import toast from 'react-hot-toast';

export const PipelineSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPipeline = async (nodes, edges) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Analyzing pipeline...', {
      style: { background: '#1e293b', color: '#94a3b8' },
    });

    try {
      const res = await parsePipeline(nodes, edges);
      console.log("Response",res)
      toast.success(
        <div className="flex flex-col gap-2 text-left w-full max-w-sm">
          <div className="font-semibold text-lg text-cyan-400">
            Pipeline Analysis
          </div>
          <div className="text-sm space-y-1 text-slate-300">
            <p>
              <span className="font-medium text-slate-100">Nodes:</span>{' '}
              {res.num_nodes}
            </p>
            <p>
              <span className="font-medium text-slate-100">Edges:</span>{' '}
              {res.num_edges}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium text-slate-100">Is DAG:</span>
              {res.is_dag ? (
                <span className="text-emerald-400 font-bold">Yes ✓</span>
              ) : (
                <span className="text-rose-400 font-bold">No ✗</span>
              )}
              <span className="text-xs">
                {res.is_dag ? '(No cycles)' : '(Cycle detected!)'}
              </span>
            </p>
          </div>
        </div>,
        {
          id: toastId,
          duration: 6000,
          icon: res.is_dag ? '😃' : '😔',
          style: {
            border: res.is_dag ? '1px solid #10b981' : '1px solid #f43f5e',
            background: '#1e293b',
          },
        }
      );
    } catch (err) {
  const errorMessage = err.response?.data?.detail 
    ?? err.message 
    ?? 'Unknown error - check console';

  toast.error(` ${errorMessage}`, {
    id: toastId,
    duration: 6000,
  });
}
      finally {
      setIsSubmitting(false);
    }
  };

  return { submitPipeline, isSubmitting };
};