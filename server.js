const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.json());

// Create MySQL connection
const connection = mysql.createConnection({
  host: 'db4free.net',
  user: 'bobatusis',
  password: 'bobatusis',
  database: 'bobatusis',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create a question
app.post('/questions/create', (req, res) => {
  const { title } = req.body;

  const query = 'INSERT INTO questions (title) VALUES (?)';
  connection.query(query, [title], (err, results) => {
    if (err) {
      console.error('Error creating question:', err);
      res.status(500).json({ error: 'Failed to create question' });
      return;
    }

    const questionId = results.insertId;
    res.status(201).json({ id: questionId, title });
  });
});

// Add an option to a question
app.post('/questions/:id/options/create', (req, res) => {
  const questionId = req.params.id;
  const { text } = req.body;

  const query = 'INSERT INTO options (question_id, text) VALUES (?, ?)';
  connection.query(query, [questionId, text], (err, results) => {
    if (err) {
      console.error('Error creating option:', err);
      res.status(500).json({ error: 'Failed to create option' });
      return;
    }

    const optionId = results.insertId;
    res.status(201).json({ id: optionId, text });
  });
});

// Add a vote to an option
app.post('/options/:id/add_vote', (req, res) => {
  const optionId = req.params.id;

  const query = 'UPDATE options SET votes = votes + 1 WHERE id = ?';
  connection.query(query, [optionId], (err, results) => {
    if (err) {
      console.error('Error adding vote:', err);
      res.status(500).json({ error: 'Failed to add vote' });
      return;
    }

    res.status(200).json({ message: 'Vote added successfully' });
  });
});

// Delete a question
app.delete('/questions/:id/delete', (req, res) => {
  const questionId = req.params.id;

  const checkVotesQuery = 'SELECT COUNT(*) AS voteCount FROM options WHERE question_id = ? AND votes > 0';
  connection.query(checkVotesQuery, [questionId], (err, results) => {
    if (err) {
      console.error('Error checking votes:', err);
      res.status(500).json({ error: 'Failed to check votes' });
      return;
    }

    const { voteCount } = results[0];
    if (voteCount > 0) {
      res.status(400).json({ error: 'Cannot delete question with existing votes' });
      return;
    }

    const deleteQuestionQuery = 'DELETE FROM questions WHERE id = ?';
    connection.query(deleteQuestionQuery, [questionId], (err, results) => {
      if (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ error: 'Failed to delete question' });
        return;
      }

      res.status(200).json({ message: 'Question deleted successfully' });
    });
  });
});

// Delete an option
app.delete('/options/:id/delete', (req, res) => {
  const optionId = req.params.id;

  const checkVotesQuery = 'SELECT votes FROM options WHERE id = ?';
  connection.query(checkVotesQuery, [optionId], (err, results) => {
    if (err) {
      console.error('Error checking votes:', err);
      res.status(500).json({ error: 'Failed to check votes' });
      return;
    }

    const { votes } = results[0];
    if (votes > 0) {
      res.status(400).json({ error: 'Cannot delete option with existing votes' });
      return;
    }

    const deleteOptionQuery = 'DELETE FROM options WHERE id = ?';
    connection.query(deleteOptionQuery, [optionId], (err, results) => {
      if (err) {
        console.error('Error deleting option:', err);
        res.status(500).json({ error: 'Failed to delete option' });
        return;
      }

      res.status(200).json({ message: 'Option deleted successfully' });
    });
  });
});

// View a question with its options and votes
app.get('/questions/:id', (req, res) => {
  const questionId = req.params.id;

  const getQuestionQuery = 'SELECT * FROM questions WHERE id = ?';
  connection.query(getQuestionQuery, [questionId], (err, questionResults) => {
    if (err) {
      console.error('Error retrieving question:', err);
      res.status(500).json({ error: 'Failed to retrieve question' });
      return;
    }

    if (questionResults.length === 0) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const getOptionsQuery = 'SELECT * FROM options WHERE question_id = ?';
    connection.query(getOptionsQuery, [questionId], (err, optionsResults) => {
      if (err) {
        console.error('Error retrieving options:', err);
        res.status(500).json({ error: 'Failed to retrieve options' });
        return;
      }

      const question = {
        id: questionResults[0].id,
        title: questionResults[0].title,
        options: optionsResults.map((option) => ({
          id: option.id,
          text: option.text,
          votes: option.votes,
          link_to_vote: `http://localhost:8000/options/${option.id}/add_vote`,
        })),
      };

      res.status(200).json(question);
    });
  });
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
