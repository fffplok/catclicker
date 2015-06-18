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
		adminMode:1,
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

		changeName: function(name, ix) {
			this.arrMenu[ix].textContent = name;
		},

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

	var viewForm = {
		render: function() {
			this.inputName.value = octopus.getCatName();
			this.inputUrl.value = octopus.getCatUrl();
			this.inputClicks.value = octopus.getCount();
		},

		getName:function() {
			return this.inputName.value;
		},

		getUrl:function() {
			return this.inputUrl.value;
		},

		getCount:function() {
			//should have err checking here
			return parseInt(this.inputClicks.value);
		},

		showForm: function(b) {
			this.elForm.style.display = (b) ? 'block' : 'none';
		},

		enableSaveCancel: function(b) {
			this.buttonSave.disabled = (b) ? 0 : 1;
			this.buttonCancel.disabled = (b) ? 0 : 1;
		},

		init: function() {
			this.containerAdmin = document.getElementById('containerAdmin');
			this.elForm = this.containerAdmin.getElementsByTagName('form')[0];
			this.buttonAdmin = document.getElementById('buttonAdmin');
			this.buttonSave = document.getElementById('buttonSave');
			this.buttonCancel = document.getElementById('buttonCancel');
			this.inputName = document.getElementById('textName');
			this.inputUrl = document.getElementById('textUrl');
			this.inputClicks = document.getElementById('textClicks');

			this.buttonAdmin.addEventListener('click', (function(style){
				return function() {
					octopus.toggleForm(style);
				};
			})(this.elForm.style));

			this.buttonSave.addEventListener('click', octopus.saveForm);
			this.buttonCancel.addEventListener('click', octopus.cancelForm);
			this.enableSaveCancel(0);

			this.containerAdmin.style.display = 'block';
			this.render();
			console.log('viewForm.init, viewForm:', this);
		}
	};

	var octopus = {
		keyHandler: document.addEventListener('keyup', function(e) {
			if (e.target === viewForm.inputName || e.target === viewForm.inputUrl || e.target === viewForm.inputClicks) {
				viewForm.enableSaveCancel(1);
			}
		}),

		//style may be '', 'none', or 'block'
		toggleForm: function(style) {
			if (!style.display | style.display === 'none') {
				viewForm.showForm(1);
			} else {
				viewForm.showForm(0);
			}
		},

		enableFormButtons: function() {
			console.log('enableFormButtons');
		},

		saveForm: function() {
			var nam = viewForm.getName(),
					imgUrl = viewForm.getUrl(),
					count = viewForm.getCount();

			//sync name
			model.cats[model.curCat].name = nam;
			viewMenu.changeName(nam, model.curCat);

			//sync url, click count
			model.cats[model.curCat].image.src = imgUrl;
			model.cats[model.curCat].clickCount = count;

			viewCat.render();
			viewForm.enableSaveCancel(0);
		},

		cancelForm: function() {
			viewForm.render();
			viewForm.enableSaveCancel(0);
		},

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

		getCatUrl:function() {
			return model.cats[model.curCat].image.src;
		},

		getCatIx:function() {
			return model.cats[model.curCat].ix;
		},

		incrementCount:function(e) {
			viewCat.updateCount(model.incrementCount());
			if (model.adminMode) viewForm.render(); //keep form in sync
		},

		getCount:function() {
			return model.getCount();
		},

		selectCat:function(i) {
			model.curCat = i;
			viewMenu.render();
			viewCat.render();
			if (model.adminMode) viewForm.render();
		},

		numCats:function() {
			return model.cats.length;
		},

		readyViews: function() {
			viewMenu.init(model.numCats);
			viewCat.init();
			if (model.adminMode) viewForm.init(model.adminMode);
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
