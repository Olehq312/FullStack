import {ref} from 'vue';
import type {Product} from '../interfaces/interfaces';


export const useProducts = () => {
    const error = ref<string | null>(null); 
    const loading = ref<boolean>(false);
    const products = ref<Product[]>([]);

    const fetchProducts = async (): Promise<void> => {
        loading.value = true;
        try {
            const response = await fetch('https://ments-restapi.onrender.com/api/products');
            if (!response.ok) {
                throw new Error('Nodata available');
            }

            const data: Product[] = await response.json();
            products.value = data;
            console.log("products fetched", products.value);
        } 
        catch (err) {
            error.value = (err as Error).message;
        }
        finally {
            loading.value = false;
        }
    };


    const addProduct = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('lsToken');
            const userID = localStorage.getItem('userIDToken');
            if (!token) {
                throw new Error('No token available');
            }
            if (!userID) {
                throw new Error('No userID available');
            }

            const response = await fetch('https://ments-restapi.onrender.com/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': token
                },
                body: JSON.stringify({
                    name: 'Product from frontend',
                    description: 'Product description',
                    imageURL: 'https://picsum.photos/500/500',
                    price: 100,
                    stock: 45,
                    discount: false,
                    discountPct: 0,
                    isHidden: false,
                    _createdBy: userID
                })
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




    const deleteProduct = async (id: string): Promise<void> => {
        try {
            const token = localStorage.getItem('lsToken');

            if (!token) {
                throw new Error('No token available');
            }

            console.log('id test', id);
            const response = await fetch(`https://ments-restapi.onrender.com/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'auth-token': token
                },
            })

            if (!response.ok) {
                throw new Error('An error occurred');
            }

            products.value = products.value.filter(product => product._id !== id);
            console.log('product deleted', id);
        }

        catch (err) {
            error.value = (err as Error).message;
        }
    };
    return {
        error,
         loading, 
         products, 
         fetchProducts,
         deleteProduct,
         addProduct
        };
};