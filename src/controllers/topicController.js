const Topic = require('../models/Topic');
const Problem = require('../models/Problem');
const UserProgress = require('../models/UserProgress');

// @desc    Get all topics with problem counts and user progress
// @route   GET /api/topics
// @access  Private
const getTopics = async (req, res) => {
  try {
    const topics = await Topic.find().lean();
    
    const topicsWithStats = await Promise.all(
      topics.map(async (topic) => {
        const problemCount = await Problem.countDocuments({ topic: topic._id });
        
        // Get user's solved count for this topic
        const solvedCount = await UserProgress.countDocuments({
          userId: req.user._id,
          topic: topic.name, // Still using name for matching existing data
          solved: true
        });

        // Get difficulty mix
        const difficulties = await Problem.aggregate([
          { $match: { topic: topic._id } },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } }
        ]);

        const difficultyMix = {
          Easy: 0,
          Medium: 0,
          Hard: 0
        };

        difficulties.forEach(d => {
          difficultyMix[d._id] = d.count;
        });

        return {
          ...topic,
          problemCount,
          solvedCount,
          difficultyMix
        };
      })
    );

    res.status(200).json(topicsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get problems for a specific topic
// @route   GET /api/topics/:slug/problems
// @access  Private
const getTopicProblems = async (req, res) => {
  const { slug } = req.params;
  const { difficulty, status } = req.query;

  try {
    const topic = await Topic.findOne({ slug });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    let query = { topic: topic._id };
    if (difficulty) query.difficulty = difficulty;

    let problems = await Problem.find(query).lean();

    // Enrich with user status
    const enrichedProblems = await Promise.all(
      problems.map(async (problem) => {
        const progress = await UserProgress.findOne({
          userId: req.user._id,
          problemId: problem._id
        });

        return {
          ...problem,
          status: progress ? (progress.solved ? 'Solved' : 'Attempted') : 'Unsolved'
        };
      })
    );

    // Filter by status if requested
    let finalProblems = enrichedProblems;
    if (status) {
      finalProblems = enrichedProblems.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    res.status(200).json({
      topic,
      problems: finalProblems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTopics,
  getTopicProblems
};
