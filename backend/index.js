
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import MongooseConector from './db.js';

dotenv.config();

// .env not in .gitignore so should be viewable
const app = express();

app.use(express.static('../frontend'));

app.use((req, res, next) => {
    bodyParser.json()(req, res, err => {
        if (err) {
            console.log('Bad JSON formatting for body');
            return res.sendStatus(400); // Bad request
        }

        next();
    });
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/recipe', async (req, res, next) => {
    const recipes = await MongooseConector.getAllRecipes();
    if (!recipes) {
        res.status(500).json({
            message: 'Server error',
        });
        return next();
    }
    res.status(200).json(recipes);
});

app.get('/api/random-recipe', async (req, res, next) => {
    const recipes = await MongooseConector.getAllRecipes();
    if (!recipes) {
        res.status(500).json({
            message: 'Server error',
        });
        return next();
    }
    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    res.status(200).json(randomRecipe);
});

app.get('/api/recipe/:name', async (req, res, next) => {
    if (!req.params.name) {
        res.status(400).json({
            message: 'Name of recipe must be given',
        });
        return next();
    }
    const recipe = await MongooseConector.getRecipeByName(req.params.name);
    if (!recipe) {
        res.status(500).json({
            message: 'Server error',
        });
        return next();
    }
    res.status(200).json(recipe);
});

app.post('/api/rating', async (req, res, next) => {
    const rating = req.body.rating;
    const id = req.body.id;
    if (!rating || !id) {
        res.status(400).json({
            message: 'Rating or id is not given',
        });
        return next();
    } else if (rating > 5 || rating < 1 || !Number.isInteger(rating)) {
        res.status(400).json({
            message: 'Rating must between 1 and 5 and a valid natural',
        });
        return next();
    }

    const successful = await MongooseConector.addRating(id, rating);
    if (!successful) {
        res.status(500).json({
            message: 'Server error',
        });
        return next();
    }

    res.status(200).json({
        message: `Successfully posted ${rating} for recipe ${id}`,
    });
});

const PORT = 3001;

(async () => {
    await MongooseConector.connect();

    // Satisfy react default port
    app.listen(PORT, 'localhost', () => {
        console.log(`Listening on port ${PORT}`);
    });
})();
