router.get('/', (req, res) => {
    res.render('plants/index', {
        heroSection: {
            title: 'Discover Our Plant Collection',
            subtitle: 'From Indoor to Outdoor, Find Your Perfect Green Companion',
            description: 'Browse through our carefully curated selection of plants, each chosen to bring life and beauty to your space.',
            bgColor: 'bg-success bg-opacity-10'
        }
    });
});

router.get('/cart', (req, res) => {
    res.render('cart/show', {
        heroSection: {
            title: 'Your Shopping Cart',
            subtitle: 'Review Your Selected Plants',
            description: 'Complete your purchase and start your gardening journey.',
            bgColor: 'bg-info bg-opacity-10'
        }
    });
});

router.get('/orders', (req, res) => {
    res.render('orders/index', {
        heroSection: {
            title: 'Your Orders',
            subtitle: 'Track Your Plant Purchases',
            description: 'View your order history and manage your deliveries.',
            bgColor: 'bg-primary bg-opacity-10'
        }
    });
});