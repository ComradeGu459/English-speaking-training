import { VideoContent } from './types';

export const CATEGORIES = [
  "All", "Daily Life", "Travel", "Growth", "Fashion", "Culture"
];

export const MOCK_VIDEOS: VideoContent[] = [
  {
    id: 'v1',
    title: "Why You Need To Be Bored",
    thumbnail: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80",
    duration: "05:20",
    level: "Advanced",
    category: "Growth",
    date: "2025/10/12",
    description: "Stanford professor discusses the psychological benefits of boredom.",
    progress: 56,
    subtitles: [
      { id: 's1', startTime: 0, endTime: 3.5, text: "I think that especially in my generation,", translation: "我认为，尤其是我们这一代人，", speaker: "Speaker A" },
      { id: 's2', startTime: 3.5, endTime: 6.0, text: "everybody has social media.", translation: "每个人都有社交媒体。", speaker: "Speaker A" },
      { id: 's3', startTime: 6.0, endTime: 11.0, text: "Everybody uses it as their primary source of information.", translation: "每个人都把它作为主要的信息来源。", speaker: "Speaker A" },
      { id: 's4', startTime: 11.0, endTime: 15.5, text: "It's the way that you consciously or subconsciously view what is trendy or cool.", translation: "无论你有意还是无意，都会通过它来了解什么是时髦的、什么是酷的。", speaker: "Speaker A" },
      { id: 's5', startTime: 15.5, endTime: 20.0, text: "Or how to live your life or what goals to set.", translation: "或者如何生活，或者设定什么样的目标。", speaker: "Speaker A" },
    ]
  },
  {
    id: 'v2',
    title: "A Day in the English Countryside",
    thumbnail: "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=800&q=80",
    duration: "12:15",
    level: "Intermediate",
    category: "Travel",
    date: "2025/10/11",
    description: "Join me for a calm day exploring the beautiful Cotswolds.",
    progress: 0,
    subtitles: [
      { id: 's1', startTime: 0, endTime: 4.0, text: "Good morning everyone, welcome back to my channel.", translation: "大家早上好，欢迎回到我的频道。", speaker: "Jay" },
      { id: 's2', startTime: 4.0, endTime: 8.5, text: "Today we are driving to the countryside.", translation: "今天我们要开车去乡下。", speaker: "Jay" },
    ]
  },
  {
    id: 'v3',
    title: "Social Media is a Double-Edged Sword",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    duration: "01:58",
    level: "Advanced",
    category: "Opinions",
    date: "2025/09/28",
    description: "Analyzing the impact of infinite scrolling on our mental health.",
    progress: 100,
    subtitles: [
      { id: 's1', startTime: 0, endTime: 4.0, text: "Because I think that especially in my generation", translation: "因为我认为，尤其是我们这一代", speaker: "Riza" },
      { id: 's2', startTime: 4.0, endTime: 8.0, text: "everybody has social media", translation: "每个人都有社交媒体", speaker: "Riza" },
      { id: 's3', startTime: 8.0, endTime: 12.0, text: "Everybody uses it as their primary source of information", translation: "每个人都把它作为主要的信息来源", speaker: "Riza" },
      { id: 's4', startTime: 12.0, endTime: 18.0, text: "It's the way that you consciously or subconsciously view what is trendy or what is cool", translation: "无论你有意还是无意，都会通过它来了解什么是时髦的、什么是酷的", speaker: "Riza" },
      { id: 's5', startTime: 18.0, endTime: 24.0, text: "or how to live your life or kind of what goals to set", translation: "或者如何生活，或者设定什么样的目标", speaker: "Riza" },
    ]
  },
  {
    id: 'v4',
    title: "Solo Trip to Florence",
    thumbnail: "https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=800&q=80",
    duration: "15:30",
    level: "Intermediate",
    category: "Travel",
    date: "2025/09/25",
    description: "Eating pasta, visiting museums, and enjoying Italy alone.",
    progress: 33,
    subtitles: [
      { id: 's1', startTime: 0, endTime: 5.0, text: "There is something magical about walking these streets alone.", translation: "独自走在这些街道上有一种神奇的感觉。", speaker: "Sarah" }
    ]
  },
  {
    id: 'v5',
    title: "100k Subscriber Growth Story",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    duration: "08:45",
    level: "Beginner",
    category: "Growth",
    date: "2025/09/20",
    description: "How I grew my channel from 0 to 100k in one year.",
    progress: 91,
    subtitles: [
      { id: 's1', startTime: 0, endTime: 5.0, text: "It wasn't easy, but consistency is key.", translation: "这并不容易，但坚持是关键。", speaker: "Mike" }
    ]
  },
  {
    id: 'v6',
    title: "Summer OOTD Collection",
    thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
    duration: "06:10",
    level: "Beginner",
    category: "Fashion",
    date: "2025/09/15",
    description: "My favorite outfits for the hot weather.",
    progress: 12,
    subtitles: [
      { id: 's1', startTime: 0, endTime: 5.0, text: "I love this linen dress, it's so breathable.", translation: "我喜欢这条亚麻裙子，很透气。", speaker: "Amy" }
    ]
  }
];