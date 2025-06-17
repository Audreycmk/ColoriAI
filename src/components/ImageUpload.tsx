'use client';

import { useRef, useState } from 'react';
import ColorThief from 'colorthief';

// export default function ImageUpload({ onExtract }: { onExtract: (img: HTMLImageElement) => void }) {
export default function ImageUpload() {
  const [previewUrl, setPreviewUrl] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  // const [hex, setHex] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleExtract = async (img: HTMLImageElement) => {
    const colorThief = new ColorThief();
    const [r, g, b] = colorThief.getColor(img);
    const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    
    console.log('Extracted hex color:', hex);

    // setHex(hex);
    // onExtract(img);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {previewUrl && (
        <>
          <img src={previewUrl} ref={imgRef} alt="Preview" width="300" />
          <button
            onClick={() => {
              if (imgRef.current) {
                handleExtract(imgRef.current);
              }
            }}
          >
            Extract Colors
          </button>
        </>
      )}
    </div>
  );
}
