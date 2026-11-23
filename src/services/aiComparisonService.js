export async function comparePetPhotosWithAI(reportA, reportB) {
  const response = await fetch('/api/ai/compare-pets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reportA: {
        type: reportA.type,
        animalName: reportA.animalName,
        species: reportA.species,
        size: reportA.size,
        colors: reportA.colors,
        characteristics: reportA.characteristics,
        photoUrls: reportA.photoUrls,
      },
      reportB: {
        type: reportB.type,
        animalName: reportB.animalName,
        species: reportB.species,
        size: reportB.size,
        colors: reportB.colors,
        characteristics: reportB.characteristics,
        photoUrls: reportB.photoUrls,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Não foi possível realizar a comparação visual.');
  }
  return data.analysis;
}
