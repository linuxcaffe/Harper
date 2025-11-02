# Harper - Harmonica Position Guide

An interactive harmonica learning tool that helps you visualize and play notes across different positions, with support for bends and overblows.

🎵 **[Try it live!](https://linuxcaffe.github.io/Harper/harper.html)** (Coming soon)

## Features

- 🎼 **5 Positions**: 1st through 5th position support
- 🎹 **Interactive Playing**: Click or tap holes to hear notes
- 🎨 **Visual Scale Highlights**: See which notes are in-scale at a glance
- 🎯 **Bent Notes**: Shows draw bends (holes 1-6) and blow bends (holes 8-10)
- 🚀 **Overblows/Overdraws**: Advanced technique visualization
- 🌓 **Dark/Light Mode**: Easy on the eyes
- 📱 **Mobile Friendly**: Works great on phones and tablets
- 🔇 **Toggle Sound**: Practice silently when needed

## Quick Start

### For Everyone (No Installation!)

1. Download `harper.html`
2. Open it in any modern web browser
3. Start playing!

That's it! The HTML file is completely self-contained.

### For Developers

#### As a React Component

```bash
# Install dependencies
npm install react lucide-react tone
```

```jsx
import HarmonicaPositionGuide from './harper.jsx';

function App() {
  return <HarmonicaPositionGuide />;
}
```

#### File Structure

```
Harper/
├── harper.jsx          # React component (for developers)
├── harper.html         # Standalone HTML (for everyone)
├── LICENSE             # MIT License
└── README.md           # This file
```

## How to Use

### Understanding Positions

Harmonica positions determine which key you're playing in relative to the harp's key:

- **1st Position (Straight Harp)**: Play in the same key as your harmonica. Great for folk and country.
- **2nd Position (Cross Harp)**: The blues standard! Play 5 semitones up from harp key.
- **3rd Position**: Minor blues and jazz. Play 10 semitones up.
- **4th Position**: Dorian mode. Play 2 semitones up.
- **5th Position**: Advanced minor. Play 7 semitones up.

### Color Coding

- 🟢 **Green**: Normal note is in scale
- 🟠 **Orange**: Bent note is in scale
- 🔵 **Blue**: Overblow/overdraw is in scale
- ⚪ **Gray**: Note is out of scale
- 🌈 **Split Colors**: Multiple techniques work on this hole

### Example: Playing Blues in G

1. Select **G** as your playing key
2. Choose **2nd Position**
3. The app tells you: Use a **C harmonica**
4. Green and orange buttons show your blues scale
5. Click buttons to hear the notes!

## Technical Details

### Dependencies

**React Component (`harper.jsx`):**
- React 18+
- lucide-react (icons)
- Tone.js (audio synthesis)

**Standalone HTML (`harper.html`):**
- All dependencies loaded from CDN
- No installation required

### Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- Web Audio API (for sound)
- CSS Grid and Flexbox

### Audio Synthesis

Harper uses Tone.js to create a harmonica-like sound with:
- Sawtooth oscillator with harmonics
- Bandpass filter for reedy tone
- ADSR envelope for natural attack and release
- Reverb for spatial depth

## Contributing

Contributions are welcome! Some ideas:

- [ ] Add 6th-12th positions
- [ ] Show scale degrees on notes
- [ ] Include common licks/patterns
- [ ] Add different tunings (country, natural minor, etc.)
- [ ] Recording/playback feature
- [ ] Metronome/practice mode
- [ ] Tutorial system
- [ ] More realistic harmonica sounds

## License

MIT License - See [LICENSE](LICENSE) file for details

## Author

Created by [linuxcaffe](https://github.com/linuxcaffe)

## Acknowledgments

- Built with React and Tone.js
- Inspired by the harmonica community
- Thanks to all blues harp players who've shared their knowledge

## Links

- 📦 **GitHub**: [https://github.com/linuxcaffe/Harper](https://github.com/linuxcaffe/Harper)
- 🐛 **Issues**: [Report a bug](https://github.com/linuxcaffe/Harper/issues)
- 💡 **Discussions**: [Share ideas](https://github.com/linuxcaffe/Harper/discussions)

---

**Happy harping! 🎵**
