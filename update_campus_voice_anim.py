import re

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

# 1. Update the speech to use a default or female voice if possible
# And make the text more clear in Hindi. 
old_speech = """    const text = `Congratulations! आपका स्वागत है NIT अरुणाचल प्रदेश में इसी तरह मेहनत करते रहिए और आगे बढ़ते रहिए थैंक यू।`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a good Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes('hi-IN')) || voices.find(v => v.lang.includes('hi-'));
    if (voice) utterance.voice = voice;
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1;"""

new_speech = """    const text = "Congratulations! आपका स्वागत है NIT अरुणाचल प्रदेश में। इसी तरह मेहनत करते रहिए और आगे बढ़ते रहिए। थैंक यू।";
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    // Try to find a specific Google Hindi voice if available, which sounds better, else fallback
    const voice = voices.find(v => v.name.includes("Google हिन्दी") || v.name.includes("Google Hindi")) 
                  || voices.find(v => v.lang === "hi-IN" && v.name.includes("Female"))
                  || voices.find(v => v.lang.includes("hi-IN"));
    if (voice) utterance.voice = voice;
    
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for female-like voice if possible
    utterance.volume = 1;"""

content = content.replace(old_speech, new_speech)


# 2. Update the audio URL
old_audio = """    // Try to play peaceful nature background sound
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/02/07/audio_c5df004944.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3");"""

new_audio = """    // Try to play peaceful nature background sound (rainforest/birds/waterfall)
    const audio = new Audio("https://soundbible.com/grab.php?id=1818&type=mp3");"""

content = content.replace(old_audio, new_audio)


# 3. Add the animations back
# I need to find where the img is and replace the comment and image tag
old_img = """      {/* Static Background Image */}
      <img 
        src={college.id === 1 ? "/nit_arunachal.png" : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200"}
        className="absolute inset-0 w-full h-full object-cover"
        alt={college.name}
      />
      
      {/* Sunlight/Atmosphere Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-amber-100/10 to-amber-200/20 mix-blend-overlay"></div>"""

new_img = """      {/* Background Image with Drone Zoom Animation */}
      <img 
        src={college.id === 1 ? "/nit_arunachal.png" : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200"}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ animation: 'droneZoom 30s ease-in-out alternate infinite' }}
        alt={college.name}
      />
      
      {/* Sunlight/Atmosphere Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-amber-100/10 to-amber-200/20 mix-blend-overlay"></div>
      
      {/* Butterflies / Fireflies */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute" style={{
            left: `${5 + Math.random() * 90}%`,
            bottom: `${Math.random() * 50}%`,
            animation: `flutter ${10+i*2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}>
            <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[1px] shadow-[0_0_8px_rgba(253,224,71,0.8)] animate-[pulse_2s_infinite]"></div>
          </div>
        ))}
      </div>
      
      {/* Walking Dog Animation */}
      <div className="absolute bottom-10 left-0 pointer-events-none text-4xl" style={{ animation: 'dogWalk 25s linear infinite' }}>
        🐕
      </div>"""

content = content.replace(old_img, new_img)

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(content)

