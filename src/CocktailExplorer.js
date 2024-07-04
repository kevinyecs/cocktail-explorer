import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader, X, Plus,  Dice6 } from 'lucide-react';

const CocktailIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 21H17M12 21V10M12 10L20 3H4L12 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 ease-in-out">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200">
            <X size={24} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

const DifficultyBar = ({ difficulty }) => (
  <div className="mt-2">
    <div className="text-sm font-medium text-gray-700 mb-1">Difficulty: {difficulty.toFixed(0)}%</div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-gradient-to-r from-green-500 to-red-500 h-2.5 rounded-full" 
        style={{ width: `${difficulty}%` }}
      ></div>
    </div>
  </div>
);

const DifficultySlider = ({ value, onChange }) => (
    <div className="w-full mb-4">
      <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Difficulty Filter</h3>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between mt-2">
        <span className="text-sm font-semibold text-purple-600">Easy</span>
        <span className="text-sm font-medium text-gray-700">Max Difficulty: {value}%</span>
        <span className="text-sm font-semibold text-pink-600">Hard</span>
      </div>
    </div>
  );

const CocktailExplorer = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cocktails, setCocktails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userIngredients, setUserIngredients] = useState([]);
    const [newIngredient, setNewIngredient] = useState('');
    const [ingredientSuggestions, setIngredientSuggestions] = useState([]);
    const [selectedCocktail, setSelectedCocktail] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [maxDifficulty, setMaxDifficulty] = useState(100);

  const commonIngredients = [
    "Vodka", "Gin", "Rum", "Tequila", "Whiskey", "Brandy", "Vermouth", "Bitters",
    "Triple Sec", "Lime Juice", "Lemon Juice", "Orange Juice", "Cranberry Juice",
    "Pineapple Juice", "Tomato Juice", "Coca-Cola", "Soda Water", "Tonic Water",
    "Ginger Beer", "Milk", "Cream", "Coffee Liqueur", "Irish Cream", "Orange Liqueur",
    "Grenadine", "Sugar Syrup", "Mint Leaves", "Olive", "Cherry", "Salt", "Pepper",
    "Ice"
  ];

  useEffect(() => {
    if (userIngredients.length > 0 || searchTerm) {
      fetchCocktails();
    } else {
      setCocktails([]);
    }
  }, [userIngredients, searchTerm]);

  useEffect(() => {
    if (newIngredient) {
      const suggestions = commonIngredients.filter(ingredient => 
        ingredient.toLowerCase().includes(newIngredient.toLowerCase()) &&
        !userIngredients.includes(ingredient)
      );
      setIngredientSuggestions(suggestions);
    } else {
      setIngredientSuggestions([]);
    }
  }, [newIngredient, userIngredients]);

  const fetchCocktails = async () => {
    setLoading(true);
    setError(null);
    try {
      let apiUrl;
      if (searchTerm) {
        apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${searchTerm}`;
      } else {
        apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${userIngredients[0]}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.drinks) {
        const detailedCocktails = await Promise.all(
          data.drinks.map(async (drink) => {
            if (!drink.strInstructions) {
              const detailResponse = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drink.idDrink}`);
              const detailData = await detailResponse.json();
              return detailData.drinks[0];
            }
            return drink;
          })
        );
        setCocktails(detailedCocktails);
      } else {
        setCocktails([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch cocktails. Please try again. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = (ingredient = newIngredient) => {
    if (ingredient && !userIngredients.includes(ingredient)) {
      setUserIngredients([...userIngredients, ingredient]);
      setNewIngredient('');
      setIngredientSuggestions([]);
    }
  };

  const removeIngredient = (ingredient) => {
    setUserIngredients(userIngredients.filter(i => i !== ingredient));
  };

  const filterCocktailsByIngredients = (cocktail) => {
    if (userIngredients.length === 0) return true;
    const cocktailIngredients = Object.keys(cocktail)
      .filter(key => key.startsWith('strIngredient') && cocktail[key])
      .map(key => cocktail[key].toLowerCase());
    
    return userIngredients.every(ingredient => 
      cocktailIngredients.some(cocktailIngredient => 
        cocktailIngredient.includes(ingredient.toLowerCase())
      )
    );
  };

  const maxIngredients = useMemo(() => {
    return cocktails.reduce((max, cocktail) => {
      const ingredientCount = Object.keys(cocktail).filter(key => key.startsWith('strIngredient') && cocktail[key]).length;
      return Math.max(max, ingredientCount);
    }, 0);
  }, [cocktails]);

  const calculateDifficulty = (cocktail) => {
    const ingredientCount = Object.keys(cocktail).filter(key => key.startsWith('strIngredient') && cocktail[key]).length;
    return (ingredientCount / maxIngredients) * 100;
  };

  const fetchRandomCocktail = async () => {
    setIsRolling(true);
    setError(null);
    try {
      const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTimeout(() => {
        setSelectedCocktail(data.drinks[0]);
        setIsRolling(false);
      }, 2000); // 2 seconds animation
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch a random cocktail. Please try again. ' + err.message);
      setIsRolling(false);
    }
  };

  const filteredCocktails = useMemo(() => {
    return cocktails.filter(cocktail => {
      const matchesIngredients = filterCocktailsByIngredients(cocktail);
      const difficulty = calculateDifficulty(cocktail);
      return matchesIngredients && difficulty <= maxDifficulty;
    });
  }, [cocktails, userIngredients, maxDifficulty]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Cocktail Explorer</h1>
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search for a specific cocktail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pr-12 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={fetchRandomCocktail}
            disabled={isRolling}
            className={`p-4 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-200 ${isRolling ? 'animate-spin' : ''}`}
          >
            <Dice6 size={24} />
          </button>
        </div>

        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:space-x-6">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Your Ingredients</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {userIngredients.map(ingredient => (
                <span key={ingredient} className="bg-gradient-to-r from-purple-200 to-pink-200 text-gray-800 px-3 py-1 rounded-full flex items-center">
                  {ingredient}
                  <button onClick={() => removeIngredient(ingredient)} className="ml-2 text-gray-600 hover:text-gray-800">
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add an ingredient"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={() => addIngredient()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 text-white p-1 rounded-full hover:bg-purple-600 transition duration-200"
              >
                <Plus size={20} />
              </button>
            </div>
            {ingredientSuggestions.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm">
                {ingredientSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => addIngredient(suggestion)}
                    className="block w-full text-left px-4 py-2 hover:bg-purple-100 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="md:w-1/2">
            <DifficultySlider value={maxDifficulty} onChange={setMaxDifficulty} />
          </div>
        </div>
      </div>

        {loading && (
          <div className="flex justify-center items-center">
            <Loader className="animate-spin text-purple-500 w-8 h-8" />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCocktails.map((cocktail) => (
            <div 
              key={cocktail.idDrink} 
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
              onClick={() => setSelectedCocktail(cocktail)}
            >
              <div className="relative">
                <img src={cocktail.strDrinkThumb} alt={cocktail.strDrink} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end justify-start p-4">
                  <h2 className="text-white text-2xl font-bold">{cocktail.strDrink}</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">{cocktail.strCategory}</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700"><span className="font-medium text-purple-600">Glass:</span> {cocktail.strGlass}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium text-purple-600">Type:</span> {cocktail.strAlcoholic}</p>
                </div>
                <DifficultyBar difficulty={calculateDifficulty(cocktail)} />
                <div className="mt-4">
                  <h3 className="font-medium text-purple-600 mb-2">Ingredients:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {[1,2,3,4,5].map(i => 
                      cocktail[`strIngredient${i}`] && (
                        <li key={i} className="mb-1">
                          <span className="font-medium">{cocktail[`strMeasure${i}`] || ''}</span> {cocktail[`strIngredient${i}`]}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-purple-600 mb-2">Instructions:</h3>
                  <p className="text-sm text-gray-700">{cocktail.strInstructions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCocktails.length === 0 && !loading && (
          <p className="text-center text-gray-600">
            {userIngredients.length > 0 || searchTerm || maxDifficulty < 100
              ? "No cocktails found. Try adjusting your filters or search terms."
              : "Add some ingredients, adjust difficulty, or search for a cocktail to get started!"}
          </p>
        )}

        <Modal isOpen={selectedCocktail !== null} onClose={() => setSelectedCocktail(null)}>
          {selectedCocktail && (
            <div className="text-gray-800">
              <div className="flex items-center mb-6">
                <CocktailIcon className="text-purple-500 w-8 h-8 mr-4" />
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {selectedCocktail.strDrink}
                </h2>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2">
                  <img src={selectedCocktail.strDrinkThumb} alt={selectedCocktail.strDrink} className="w-full h-64 object-cover rounded-lg shadow-lg mb-4" />
                  <p className="text-lg font-semibold text-purple-600 mb-2">{selectedCocktail.strCategory}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-700"><span className="font-medium text-purple-600">Glass:</span> {selectedCocktail.strGlass}</p>
                    <p className="text-gray-700"><span className="font-medium text-purple-600">Type:</span> {selectedCocktail.strAlcoholic}</p>
                  </div>
                  <DifficultyBar difficulty={calculateDifficulty(selectedCocktail)} />
                </div>
                <div className="md:w-1/2">
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-purple-600 mb-3">Ingredients</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => 
                        selectedCocktail[`strIngredient${i}`] && (
                          <li key={i}>
                            <span className="font-medium">{selectedCocktail[`strMeasure${i}`] || ''}</span> {selectedCocktail[`strIngredient${i}`]}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-purple-600 mb-3">Instructions</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedCocktail.strInstructions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default CocktailExplorer;