const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Topic = require('./src/models/Topic');
const Problem = require('./src/models/Problem');

dotenv.config();

const topics = [
  {
    name: 'Arrays & Hashing',
    slug: 'arrays-hashing',
    icon: 'Layers',
    description: 'Fundamental data structure for storing collections of elements.',
    color: 'from-blue-500/20 to-blue-600/20'
  },
  {
    name: 'Two Pointers',
    slug: 'two-pointers',
    icon: 'ArrowRightLeft',
    description: 'Efficiently search or process sorted arrays or linked lists.',
    color: 'from-purple-500/20 to-purple-600/20'
  },
  {
    name: 'Sliding Window',
    slug: 'sliding-window',
    icon: 'Layout',
    description: 'Optimize sub-array problems using a window that slides over the data.',
    color: 'from-green-500/20 to-green-600/20'
  },
  {
    name: 'Binary Search',
    slug: 'binary-search',
    icon: 'Search',
    description: 'Logarithmic search algorithm for sorted datasets.',
    color: 'from-yellow-500/20 to-yellow-600/20'
  },
  {
    name: 'Trees',
    slug: 'trees',
    icon: 'TreePine',
    description: 'Hierarchical data structures and traversal algorithms.',
    color: 'from-emerald-500/20 to-emerald-600/20'
  },
  {
    name: 'Graphs',
    slug: 'graphs',
    icon: 'Network',
    description: 'Complex relationships and connectivity problems.',
    color: 'from-red-500/20 to-red-600/20'
  },
  {
    name: 'Dynamic Programming',
    slug: 'dynamic-programming',
    icon: 'Zap',
    description: 'Optimization through sub-problem solving and memoization.',
    color: 'from-cyan-500/20 to-cyan-600/20'
  },
  {
    name: 'Strings',
    slug: 'strings',
    icon: 'Type',
    description: 'Pattern matching, manipulation, and character-based problems.',
    color: 'from-indigo-500/20 to-indigo-600/20'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Topic.deleteMany({});
    console.log('Cleared existing topics');

    const createdTopics = await Topic.insertMany(topics);
    console.log('Seeded topics successfully');

    // Create some dummy problems for the first topic
    const arrayTopic = createdTopics.find(t => t.slug === 'arrays-hashing');
    
    await Problem.deleteMany({ topic: arrayTopic._id });
    
    const dummyProblems = [
      {
        title: 'Two Sum',
        description: 'Find two numbers that add up to a target.',
        difficulty: 'Easy',
        topic: arrayTopic._id,
        createdBy: new mongoose.Types.ObjectId() // Temporary
      },
      {
        title: 'Contains Duplicate',
        description: 'Check if any value appears at least twice.',
        difficulty: 'Easy',
        topic: arrayTopic._id,
        createdBy: new mongoose.Types.ObjectId()
      },
      {
        title: 'Valid Anagram',
        description: 'Check if two strings are anagrams of each other.',
        difficulty: 'Easy',
        topic: arrayTopic._id,
        createdBy: new mongoose.Types.ObjectId()
      },
      {
        title: 'Top K Frequent Elements',
        description: 'Find the K most frequent elements in an array.',
        difficulty: 'Medium',
        topic: arrayTopic._id,
        createdBy: new mongoose.Types.ObjectId()
      },
      {
        title: 'Longest Consecutive Sequence',
        description: 'Find the length of the longest consecutive elements sequence.',
        difficulty: 'Hard',
        topic: arrayTopic._id,
        createdBy: new mongoose.Types.ObjectId()
      }
    ];

    await Problem.insertMany(dummyProblems);
    console.log('Seeded dummy problems for Arrays topic');

    process.exit();
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
};

seedDB();
