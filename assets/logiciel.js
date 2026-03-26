(function () {
  const zodiac = [
    { name: 'Bélier', glyph: '♈', start: 0, tone: 'Impulsion, départ, affirmation.' },
    { name: 'Taureau', glyph: '♉', start: 30, tone: 'Ancrage, matière, sensualité.' },
    { name: 'Gémeaux', glyph: '♊', start: 60, tone: 'Mouvement, langage, curiosité.' },
    { name: 'Cancer', glyph: '♋', start: 90, tone: 'Mémoire, protection, intériorité.' },
    { name: 'Lion', glyph: '♌', start: 120, tone: 'Rayonnement, identité, création.' },
    { name: 'Vierge', glyph: '♍', start: 150, tone: 'Précision, tri, service.' },
    { name: 'Balance', glyph: '♎', start: 180, tone: 'Harmonie, lien, ajustement.' },
    { name: 'Scorpion', glyph: '♏', start: 210, tone: 'Transmutation, intensité, secret.' },
    { name: 'Sagittaire', glyph: '♐', start: 240, tone: 'Sens, expansion, trajectoire.' },
    { name: 'Capricorne', glyph: '♑', start: 270, tone: 'Structure, ambition, maîtrise.' },
    { name: 'Verseau', glyph: '♒', start: 300, tone: 'Réseau, vision, rupture.' },
    { name: 'Poissons', glyph: '♓', start: 330, tone: 'Fusion, intuition, mystère.' }
  ];

  const wheel = document.querySelector('[data-degree-wheel]');
  const input = document.querySelector('[data-degree-input]');
  const number = document.querySelector('[data-degree-number]');
  const output = document.querySelector('[data-degree-output]');
  const signOut = document.querySelector('[data-sign-output]');
  const posOut = document.querySelector('[data-pos-output]');
  const toneOut = document.querySelector('[data-tone-output]');
  const summaryButton = document.querySelector('[data-generate-summary]');
  const summary = document.querySelector('[data-summary]');

  if (!wheel || !input || !number) return;

  const indicator = document.createElement('div');
  indicator.className = 'degree-indicator';
  wheel.appendChild(indicator);

  const center = document.createElement('div');
  center.className = 'degree-center';
  wheel.appendChild(center);

  const label = document.createElement('div');
  label.className = 'glyph-label';
  wheel.appendChild(label);

  zodiac.forEach((sign, index) => {
    const angle = (index * 30) - 90;
    const rad = angle * Math.PI / 180;
    const radiusPercent = 39;
    const x = 50 + Math.cos(rad) * radiusPercent;
    const y = 50 + Math.sin(rad) * radiusPercent;

    const glyph = document.createElement('div');
    glyph.className = 'glyph';
    glyph.textContent = sign.glyph;
    glyph.style.left = `${x}%`;
    glyph.style.top = `${y}%`;
    glyph.style.fontSize = '2rem';
    wheel.appendChild(glyph);
  });

  function normalizeDegree(value) {
    return ((Number(value) % 360) + 360) % 360;
  }

  function describeDegree(value) {
    const degree = normalizeDegree(value);
    const signIndex = Math.floor(degree / 30);
    const sign = zodiac[signIndex];
    const within = degree - sign.start;
    const decan = Math.floor(within / 10) + 1;
    const phase = within < 10 ? 'amorce' : (within < 20 ? 'déploiement' : 'maturation');
    const angle = degree - 90;

    indicator.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;

    output.textContent = `${degree.toFixed(1)}°`;
    signOut.textContent = `${sign.glyph} ${sign.name}`;
    posOut.textContent = `${within.toFixed(1)}° — décan ${decan} — phase ${phase}`;
    toneOut.textContent = `${sign.tone} Ici, la lecture Helios insiste sur la forme émergente, la densité du centre et l’orientation des lignes.`;

    label.innerHTML = `<strong>${sign.glyph} ${sign.name}</strong><br>${within.toFixed(1)}° dans le signe`;
  }

  function syncFromRange() {
    number.value = input.value;
    describeDegree(input.value);
  }

  function syncFromNumber() {
    input.value = number.value;
    describeDegree(number.value);
  }

  input.addEventListener('input', syncFromRange);
  number.addEventListener('input', syncFromNumber);

  if (summaryButton && summary) {
    summaryButton.addEventListener('click', function () {
      const name = document.querySelector('[data-name]')?.value || 'Sujet';
      const place = document.querySelector('[data-place]')?.value || 'Lieu non renseigné';
      const date = document.querySelector('[data-date]')?.value || 'Date non renseignée';
      const time = document.querySelector('[data-time]')?.value || 'Heure non renseignée';

      const degree = normalizeDegree(input.value);
      const signIndex = Math.floor(degree / 30);
      const sign = zodiac[signIndex];
      const within = (degree - sign.start).toFixed(1);

      summary.innerHTML = `
        <strong>Prélecture Helios pour ${name}</strong><br>
        Données reçues : ${date}, ${time}, ${place}.<br>
        Point sélectionné : ${degree.toFixed(1)}° → ${sign.glyph} ${sign.name} (${within}°).<br>
        Axe dominant : ${sign.tone}<br>
        Restitution proposée : visuel mandala HD + lecture symbolique + section “formes émergentes”.
      `;
    });
  }

  syncFromRange();
})();
