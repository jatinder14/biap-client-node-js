import CartService from './cart.service.js';

const cartService = new CartService();

class CartController {

    async addItem(req, res, next) {
        
        try {
            const { cart_key, userId } = req.params
            if ((!userId || userId == "guestUser") && (!cart_key || ['null', 'undefined'].includes(cart_key))) {
                res.header("Access-Control-Allow-Origin", "*");
                return res.status(400).json({ success: false, message: "Rquired parameters are missing!" })
            }
            const result = await cartService.addItem({...req.body, ...req.params})
            res.send(result);
        }
        catch (err) {
           next(err);
        }
    }

    async getCartItem(req, res, next) {
        try {
            const { cart_key, userId } = req.params
            if ((!userId || userId == "guestUser") && (!cart_key || ['null', 'undefined'].includes(cart_key))) {
                res.header("Access-Control-Allow-Origin", "*");
                return res.status(400).json({ success: false, message: "Rquired parameters are missing!" })
            }
            const cartItem=await cartService.getCartItem({...req.query,...req.params })
            req.body.responseData = cartItem;
            next()

        }
        catch (err) {
            next(err);
        }
    }

    async updateItem(req, res, next) {
        try {
            return  res.send(await cartService.updateItem({...req.body,...req.params}));
        }
        catch (err) {
            next(err);
        }
    }

    async removeItem(req, res, next) {
        try {
            return  res.send(await cartService.removeItem({...req.body,...req.params}));

        }
        catch (err) {
            next(err);
        }
    }

    async clearCart(req, res, next) {
        try {
            return  res.send(await cartService.clearCart({ ...req.params }));
        }
        catch (err) {
            next(err);
        }
    }

}

export default CartController;
