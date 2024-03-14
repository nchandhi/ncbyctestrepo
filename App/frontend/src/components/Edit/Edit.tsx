import React, { useState } from 'react';
import Modal from 'react-modal';

interface EditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (outputText: string) => void;
}

const EditPopup: React.FC<EditPopupProps> = ({ isOpen, onClose, onApply }) => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');

  // Handler for updating input text
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  // Handler for generating output
  const handleGenerate = () => {
    // Logic for generating output based on input text
    // Example: Convert input text to uppercase
    const generatedOutput = inputText.toUpperCase();
    setOutputText(generatedOutput);
  };

  // Handler for applying changes
  const handleApply = () => {
    onApply(outputText);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      <div>
        <h2>Research Topic</h2>
        <textarea value={inputText} onChange={handleInputChange} />
        <button onClick={handleGenerate}>Generate</button>
      </div>
      <div>
        <h3>Output</h3>
        <textarea value={outputText} readOnly />
        <button onClick={handleApply}>Apply</button>
      </div>
    </Modal>
  );
};

export default EditPopup;
