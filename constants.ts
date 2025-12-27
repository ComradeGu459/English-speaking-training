import { VideoContent } from './types';

export const CATEGORIES = [
  "Daily Life", "Fashion", "Personal Growth", "Opinions", "Culture", "Travel", "Nature"
];

export const MOCK_VIDEOS: VideoContent[] = [
  {
    id: 'v1',
    title: "Why You Need To Be Bored",
    thumbnail: "https://picsum.photos/id/1/800/450",
    duration: "05:20",
    level: "Intermediate",
    category: "Personal Growth",
    date: "2025/10/12",
    description: "Stanford professor discusses the psychological benefits of boredom and why we find it so hard to disconnect.",
    subtitles: [
      { id: 's1', startTime: 0, endTime: 3.5, text: "I think that especially in my generation,", translation: "我认为，尤其是我们这一代人，", speaker: "Speaker A" },
      { id: 's2', startTime: 3.5, endTime: 6.0, text: "everybody has social media.", translation: "每个人都有社交媒体。", speaker: "Speaker A" },
      { id: 's3', startTime: 6.0, endTime: 11.0, text: "Everybody uses it as their primary source of information.", translation: "每个人都把它作为主要的信息来源。", speaker: "Speaker A" },
      { id: 's4', startTime: 11.0, endTime: 15.5, text: "It's the way that you consciously or subconsciously view what is trendy or cool.", translation: "无论你有意还是无意，都会通过它来了解什么是时髦的、什么是酷的。", speaker: "Speaker A" },
      { id: 's5', startTime: 15.5, endTime: 20.0, text: "Or how to live your life or what goals to set.", translation: "或者如何生活，或者设定什么样的目标。", speaker: "Speaker A" },
      { id: 's6', startTime: 20.0, endTime: 24.0, text: "And so that last piece, I think, is quite unattainable.", translation: "所以最后这一点，我认为，是遥不可及的。", speaker: "Speaker A" },
      { id: 's7', startTime: 24.0, endTime: 28.0, text: "We constantly see highlight reels of other people's lives.", translation: "我们总是看到别人生活中的高光时刻。", speaker: "Speaker A" },
    ]
  },
  {
    id: 'v2',
    title: "Morning Routine & Breakfast Vlog",
    thumbnail: "https://picsum.photos/id/42/800/450",
    duration: "10:15",
    level: "Beginner",
    category: "Daily Life",
    date: "2025/10/11",
    description: "Join me for a calm morning routine, making coffee, and preparing a healthy breakfast.",
    subtitles: [
      { id: 's1', startTime: 0, endTime: 4.0, text: "Good morning everyone, welcome back to my channel.", translation: "大家早上好，欢迎回到我的频道。", speaker: "Jay" },
      { id: 's2', startTime: 4.0, endTime: 8.5, text: "Today I want to show you my typical slow morning routine.", translation: "今天我想向大家展示我典型的慢节奏早晨例程。", speaker: "Jay" },
      { id: 's3', startTime: 8.5, endTime: 12.0, text: "First things first, I always start with a glass of water.", translation: "首先，我总是以一杯水开始。", speaker: "Jay" },
    ]
  },
  {
    id: 'v3',
    title: "Summer OOTD & Styling Tips",
    thumbnail: "https://picsum.photos/id/64/800/450",
    duration: "08:30",
    level: "Intermediate",
    category: "Fashion",
    date: "2025/09/28",
    description: "How to dress comfortable yet stylish for the summer heat. Sharing my favorite outfits.",
    subtitles: [
      { id: 's1', startTime: 0, endTime: 4.0, text: "I think I have decided what I'm gonna be wearing today.", translation: "我想我已经决定好今天穿什么了。", speaker: "Riza" },
      { id: 's2', startTime: 4.0, endTime: 7.0, text: "I'm gonna wear these capris.", translation: "我准备穿这条七分裤。", speaker: "Riza" },
      { id: 's3', startTime: 7.0, endTime: 11.5, text: "Super cute with some really fun details.", translation: "超级可爱，还有一些非常有趣的细节。", speaker: "Riza" },
    ]
  }
];
