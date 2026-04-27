const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory if needed
dotenv.config({ path: path.join(__dirname, '../.env') });

const Topic = require('./models/Topic');

const topics = [
  // Core Topics
  { name: "Arrays", slug: "arrays", icon: "LayoutGrid", color: "from-blue-500/20 to-blue-600/20", description: "Master array manipulation, searching, and sorting." },
  { name: "Strings", slug: "strings", icon: "Type", color: "from-purple-500/20 to-purple-600/20", description: "String parsing, pattern matching, and manipulation." },
  { name: "Hash Table", slug: "hash-table", icon: "Hash", color: "from-green-500/20 to-green-600/20", description: "Efficient key-value mapping and frequency counting." },
  { name: "Math", slug: "math", icon: "Percent", color: "from-yellow-500/20 to-yellow-600/20", description: "Mathematical logic, number theory, and geometry." },
  { name: "Sorting", slug: "sorting", icon: "ArrowDownAZ", color: "from-orange-500/20 to-orange-600/20", description: "Standard sorting algorithms and their applications." },
  { name: "Searching", slug: "searching", icon: "Search", color: "from-cyan-500/20 to-cyan-600/20", description: "Binary search, linear search, and specialized search techniques." },

  // Data Structures
  { name: "Stack", slug: "stack", icon: "Layers", color: "from-indigo-500/20 to-indigo-600/20", description: "LIFO data structures and monotonic stacks." },
  { name: "Queue", slug: "queue", icon: "IterationCcw", color: "from-rose-500/20 to-rose-600/20", description: "FIFO data structures and priority queues." },
  { name: "Linked List", slug: "linked-list", icon: "Link", color: "from-teal-500/20 to-teal-600/20", description: "Singly, doubly, and circular linked lists." },
  { name: "Heap", slug: "heap", icon: "ArrowUpCircle", color: "from-amber-500/20 to-amber-600/20", description: "Priority queues and min/max heaps." },

  // Tree & Graph
  { name: "Binary Tree", slug: "binary-tree", icon: "GitMerge", color: "from-blue-500/20 to-indigo-600/20", description: "Binary tree structures and basic traversals." },
  { name: "Binary Search Tree", slug: "binary-search-tree", icon: "Binary", color: "from-emerald-500/20 to-emerald-600/20", description: "Efficient searching in ordered trees." },
  { name: "Graph", slug: "graph", icon: "Network", color: "from-violet-500/20 to-violet-600/20", description: "Representations and traversals of connected components." },
  { name: "DFS", slug: "dfs", icon: "Route", color: "from-fuchsia-500/20 to-fuchsia-600/20", description: "Depth-first exploration of trees and graphs." },
  { name: "BFS", slug: "bfs", icon: "Waves", color: "from-sky-500/20 to-sky-600/20", description: "Breadth-first level-order exploration." },

  // Algorithm Techniques
  { name: "Dynamic Programming", slug: "dynamic-programming", icon: "Cpu", color: "from-red-500/20 to-red-600/20", description: "Optimization through subproblems and memoization." },
  { name: "Greedy", slug: "greedy", icon: "Zap", color: "from-yellow-500/20 to-amber-600/20", description: "Making locally optimal choices for global solutions." },
  { name: "Backtracking", slug: "backtracking", icon: "Undo2", color: "from-pink-500/20 to-pink-600/20", description: "Exhaustive search with pruning." },
  { name: "Sliding Window", slug: "sliding-window", icon: "Square", color: "from-orange-500/20 to-red-600/20", description: "Fixed and variable size window techniques." },
  { name: "Two Pointers", slug: "two-pointers", icon: "ArrowRightLeft", color: "from-blue-400/20 to-blue-600/20", description: "Efficient iteration with multiple pointers." },

  // Advanced
  { name: "Trie", slug: "trie", icon: "SearchCode", color: "from-lime-500/20 to-lime-600/20", description: "Prefix trees for efficient string operations." },
  { name: "Union Find", slug: "union-find", icon: "Combine", color: "from-slate-500/20 to-slate-600/20", description: "Disjoint set union for connectivity problems." },
  { name: "Bit Manipulation", slug: "bit-manipulation", icon: "Binary", color: "from-gray-500/20 to-gray-600/20", description: "Low-level operations for performance and logic." },
  { name: "Segment Tree", slug: "segment-tree", icon: "Split", color: "from-indigo-400/20 to-indigo-700/20", description: "Range queries and updates." }
];

const seedTopics = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Delete existing topics (optional, but good for a fresh start)
    // await Topic.deleteMany({});

    for (const topicData of topics) {
      await Topic.findOneAndUpdate(
        { slug: topicData.slug },
        topicData,
        { upsert: true, new: true }
      );
      console.log(`Seeded/Updated topic: ${topicData.name}`);
    }

    console.log('All topics seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedTopics();
