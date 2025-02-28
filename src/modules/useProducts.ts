import {ref} from 'vue';
import type {newProduct, Product} from '../interfaces/interfaces';
const API_URL = import.meta.env.VITE_API_URL;



export const useProducts = () => {
    const error = ref<string | null>(null); 
    const loading = ref<boolean>(false);
    const products = ref<Product[]>([]);

    const fetchProducts = async (): Promise<void> => {
        loading.value = true;
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) {
                throw new Error('No data available');
            }
    
            const data: Product[] = await response.json();
            products.value = data;
            console.log("Products fetched", products.value);
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            loading.value = false;
        }
    };





    const getTokenAndUserId = (): {token: string, userID: string} => {

            const token = localStorage.getItem('lsToken');
            const userID = localStorage.getItem('userIDToken');
            if (!token) {
                throw new Error('No token available');
            }
            if (!userID) {
                throw new Error('No userID available');
            }
            return {token, userID};
        }


    const validateProduct = (product: newProduct):void => {
        if (!product.name) {
            throw new Error('Name is required');
        }
    }


    const setDefultValues = (product: newProduct, userID: string) => {
        return {
            name: product.name,
            description: product.description || 'New fresh description',
            imageURL: product.imageURL || 'https://picsum.photos/500/500',
            price: product.price || 101,
            stock: product.stock || 52,
            discount: product.discount || false,
            discountPct: product.discountPct || 0,
            isHidden: product.isHidden || false,
            _createdBy: userID
        }
    }


    const addProduct = async (product: newProduct): Promise<void> => {
        try {
            const {token, userID} = getTokenAndUserId();
            validateProduct(product);
            const productWithDefaults = setDefultValues(product, userID);

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': token
                },
                body: JSON.stringify(productWithDefaults)
            })

            if (!response.ok) {
                const errorResponse = await response.json()
                throw new Error(errorResponse.error || 'An error occurred');

            }
            
            const newProduct: Product = await response.json();
            products.value.push(newProduct);
            console.log('product added', newProduct);
            await fetchProducts();

        }
        catch (err) {
            error.value = (err as Error).message;
        }
    }



    const deleteProductFromServer = async (id: string, token: string): Promise<void> => {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'auth-token': token
            },
        })

        if (!response.ok) {
            console.log('product not deleted');
            throw new Error('An error occurred');
        }
    }

    const removeProductFromState = (id: string): void => {

        products.value = products.value.filter(product => product._id !== id);
        console.log('product deleted', id);
    }




    const deleteProduct = async (id: string): Promise<void> => {
        try {
            const {token} = getTokenAndUserId();
            await deleteProductFromServer(id, token);
            removeProductFromState(id);

            console.log('id test', id);
            

        }

        catch (err) {
            error.value = (err as Error).message;
        }
    };


    const updateProductOnServer = async (id: string, updatedProduct: Partial<Product>, token: string): Promise<Product> => {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': token
            },
            body: JSON.stringify(updatedProduct)
        })
        if (!response.ok) {
            throw new Error('An error occurred');
        }

        const responseText = await response.text();
        try {
            return JSON.parse(responseText);
        }
        catch {
            return { message: responseText } as unknown as Product;
        }

        //return await response.json();
    }


    const updateProductInState = (id: string, updatedProduct: Product): void => {
        const index = products.value.findIndex(product => product._id === id);
        if (index !== -1) {
            products.value[index] = updatedProduct;
        }
    }

    const updateProduct = async (id: string, updatedProduct: Partial<Product>): Promise<void> => {
        try {
            const token = getTokenAndUserId().token;
            const updatedProductResponse = await updateProductOnServer(id, updatedProduct, token);
            updateProductInState(id, updatedProductResponse);
            await fetchProducts();
        }


        catch (err) {
            error.value = (err as Error).message;
        }
    }

    return {
        error,
         loading, 
         products, 
         fetchProducts,
         deleteProduct,
         addProduct,
         getTokenAndUserId,
         updateProduct
        };
};