// submit.js

import { useStore } from "./store";
import { PipelineSubmit } from "./hook/pipelineSubmit";
export const SubmitButton = () => {

    const {nodes, edges} = useStore();
    console.log("Submitting Pipeline");
    console.log("Nodes:", nodes);
    console.log("Edges:", edges);

    const {submitPipeline} = PipelineSubmit()
    
  const handleSubmit = (e) => {
    e.preventDefault();
    submitPipeline(nodes, edges);
  };

    return (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <button onClick={handleSubmit} type="submit">Submit</button>
        </div>
    );
}
