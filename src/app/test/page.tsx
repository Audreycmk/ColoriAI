'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import TransitionWrapper from '@/components/TransitionWrapper';

export default function TestPage() {
  const [age, setAge] = useState('');
  // const [ethnicity, setEthnicity] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const router = useRouter(); // Initialize router

  const handleStyleChange = (style: string) => {
    if (styles.includes(style)) {
      setStyles(styles.filter((s) => s !== style));
    } else {
      setStyles([...styles, style]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    const query = new URLSearchParams({
      age,
      // ethnicity,
      styles: styles.join(','),
    }).toString();
  
    router.push(`/upload-image/selfie?${query}`);
  };
  
  return (
    <TransitionWrapper>
      <div className="mobile-display">
        <div className="test-form" style={{ padding: '2rem', width: '100%', margin: '0 auto' }}>
          <h2>Personal Style Test</h2>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{ marginBottom: '1rem' }}
          >
            ← Back to Home
          </button>

          <form onSubmit={handleSubmit}>
            {/* Age */}
            <div>
              <label htmlFor="age">Age:</label><br />
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            {/* Ethnicity- Hidden */}
            {/* <div style={{ marginTop: '1rem' }}>
              <label htmlFor="ethnicity">Ethnicity:</label><br />
              <select
                id="ethnicity"
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
                required
              >
                <option value="">-- Select Ethnicity --</option>
                <option value="East Asian">East Asian (e.g., Chinese, Japanese)</option>
                <option value="South Asian">South Asian (e.g., Indian, Sri Lankan)</option>
                <option value="Southeast Asian">Southeast Asian (e.g., Filipino, Vietnamese)</option>
                <option value="Middle Eastern / North African">Middle Eastern / North African (e.g., Egyptian, Iranian)</option>
                <option value="Sub-Saharan African">Sub-Saharan African (e.g., Nigerian, Ethiopian)</option>
                <option value="European">European (e.g., German, Russian)</option>
                <option value="Latino / Hispanic">Latino / Hispanic (e.g., Mexican, Brazilian)</option>
                <option value="Mixed">Mixed</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div> */}

            {/* Preferred Styles */}
            <div style={{ marginTop: '1rem' }}>
              <label>Preferred Style(s):</label><br />
              <label><input type="checkbox" value="Casual" onChange={() => handleStyleChange('Casual')} /> Casual</label><br />
              <label><input type="checkbox" value="Daily" onChange={() => handleStyleChange('Daily')} /> Daily</label><br />
              <label><input type="checkbox" value="Sporty" onChange={() => handleStyleChange('Sporty')} /> Sporty</label><br />
              <label><input type="checkbox" value="Chic" onChange={() => handleStyleChange('Chic')} /> Chic</label><br />
              <label><input type="checkbox" value="Girly" onChange={() => handleStyleChange('Girly')} /> Girly</label><br />
              <label><input type="checkbox" value="Formal" onChange={() => handleStyleChange('Formal')} /> Formal</label><br />
              <label><input type="checkbox" value="Streetwear" onChange={() => handleStyleChange('Streetwear')} /> Streetwear</label><br />
              <label><input type="checkbox" value="K-pop" onChange={() => handleStyleChange('K-pop')} /> K-pop</label><br />
              <label><input type="checkbox" value="Vintage" onChange={() => handleStyleChange('Vintage')} /> Vintage</label><br />
            </div>

            <button type="submit" style={{ marginTop: '1.5rem' }}>Submit</button>
          </form>
        </div>
      </div>
    </TransitionWrapper>
  );
}
