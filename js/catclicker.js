//my solution for catclicker premium. two views, one for menu, one for cat image with info. menu built with js, not obtained via markup
(function() {
	//use http://api.randomuser.me to obtain random user information (for names)
	//see https://randomuser.me/documentation
	var getNames = function(numCats) {
		var arrNames = [],
				name = "",
				httpRequest,
				url = 'http://api.randomuser.me/?results=' + numCats + '&nat=fr';

		httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = function() {
			try {
		    if (this.readyState === 4) {
		      if (this.status === 200) {
		        var response = JSON.parse(this.responseText),
		        		name;
		        for (var i = 0; i < numCats; i++) {
		        	name = response.results[i].user.name;
		        	arrNames.push(name.title + ' ' + name.first + ' ' + name.last);
		        }
		        //we've got names, now create cats
		        octopus.buildCats(arrNames);
		      } else {
		        console.log('There was a problem with the request.');
		      }
		    }
			} catch(e) {
				console.log('caught exception: ' + e.description);
			}
		}

		httpRequest.open('GET', url);
		httpRequest.send(null);
	};

	var Cat = function(nam, ix) {
		this.name = nam;
		this.image = new Image();
		this.image.src = "http://lorempixel.com/640/480/cats?"+ix;
		this.image.onload = model.imageLoaded;
		this.clickCount = 0;
		this.ix = ix;

		return this;
	};

	var model = {
		numCats:5,
		numCatsReady:0,
		curCat:0,
		cats:[],

		init: function(arrNames) {
			var name;
			for (var i = 0; i < arrNames.length; i++) {
				name = arrNames[i];
				model.cats.push(new Cat(name, i));
			}
		},

		//wait until all images loaded to build view
		imageLoaded: function(e) {
			//console.log('imageLoaded, model.numCatsReady:', model.numCatsReady);
			++model.numCatsReady;
			if (model.numCatsReady === model.numCats) {
				octopus.readyViews();
			}
		},

		incrementCount: function() {
			this.cats[this.curCat].clickCount++;
			return this.cats[this.curCat].clickCount;
		},

		getCount: function() {
			return this.cats[this.curCat].clickCount;
		}

	};

	var viewMenu = {
		arrMenu: document.getElementsByTagName('li'),

		render: function() {
			//also update menu to show which cat is selected
			var itemMenu;
			for (var i = 0; i < octopus.numCats(); i++) {
				itemMenu = this.arrMenu[i];
				if (itemMenu.classList && itemMenu.classList.contains('selected')) {
					itemMenu.classList.remove('selected');
					break;
				}
			}

			this.arrMenu[octopus.getCatIx()].classList.add('selected');
		},

		init: function(numCats) {
			var i, itemMenu, liStart,
					elMenu = document.getElementsByClassName('menu')[0];

			//build menu li items and assign listener
			for (i = 0; i < numCats; i++) {
				itemMenu = document.createElement('li');
				if (i === 0) itemMenu.classList.add('selected');
				itemMenu.textContent = octopus.getCatName(i);
				itemMenu.addEventListener('click', (function(ix) {
					return function() {
						octopus.selectCat(ix);
					};
				})(i));
				elMenu.appendChild(itemMenu);
			}
		}
	};

	var viewCat = {
		container: document.getElementsByClassName('container')[0],
		elImage: null,
		elName: null,
		elCount: null,

		//see this for managing css class in javascript (ie10+): http://stackoverflow.com/questions/195951/change-an-elements-css-class-with-javascript
		//updateDisplayInfo: function() {
		render: function() {
			this.elImage.src = octopus.getCatSrc();
			this.elName.textContent = octopus.getCatName();
			this.updateCount(octopus.getCount());
		},

		updateCount: function(num) {
			this.elCount.textContent = 'click count: ' + num;
		},

		init: function() {
			this.elImage = this.container.getElementsByTagName('img')[0];
			this.elName = this.container.getElementsByClassName('name')[0];
			this.elCount = this.container.getElementsByClassName('count')[0];

			//assign event listener to container's image
			this.elImage.addEventListener('click', octopus.incrementCount);

			//display first cat
			this.render();

			//container was display:none; render it now
			this.container.style.display = 'block';
		},
	};

	var octopus = {
		getCatSrc:function() {
			return model.cats[model.curCat].image.src;
		},

		//get cat name of current cat or cat at a particular index
		getCatName:function() {
			if (arguments.length) {
				return model.cats[arguments[0]].name;
			}
			return model.cats[model.curCat].name;
		},

		getCatIx:function() {
			return model.cats[model.curCat].ix;
		},

		incrementCount:function(e) {
			viewCat.updateCount(model.incrementCount());
		},

		getCount:function() {
			return model.getCount();
		},

		selectCat:function(i) {
			model.curCat = i;
			viewMenu.render();
			viewCat.render();
		},

		numCats:function() {
			return model.cats.length;
		},

		readyViews: function() {
			viewMenu.init(model.numCats);
			viewCat.init();
		},

		buildCats: function(arrNames) {
			model.init(arrNames);
		},

		init: function() {
			getNames(model.numCats);
		}

	};

	octopus.init();

})();
