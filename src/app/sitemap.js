export default function sitemap() {
  const base = 'https://pegazo.co';
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/register`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
