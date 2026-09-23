const fs = require('fs');
const content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

let newContent = content.replace(
  'const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);',
  `const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCalcTooltip, setShowCalcTooltip] = useState(false);
  const [showCalcBadge, setShowCalcBadge] = useState(false);

  useEffect(() => {
    const clickedMenu = localStorage.getItem('hasClickedMenuForCalc');
    const clickedCalc = localStorage.getItem('hasClickedCalcLink');
    if (!clickedMenu && !clickedCalc) setShowCalcTooltip(true);
    if (!clickedCalc) setShowCalcBadge(true);
  }, []);

  useEffect(() => {
    const handleClick = () => {
      if (showCalcTooltip) {
        setShowCalcTooltip(false);
        localStorage.setItem('hasClickedMenuForCalc', 'true');
      }
    };
    if (showCalcTooltip) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showCalcTooltip]);`
);

fs.writeFileSync('src/components/Layout.tsx', newContent);
