// utils.js
export const transformProductDetails = (item, productsDetailsArray) => {
  const productDetails = productsDetailsArray.find(el => item.item_id === el.item_details.id) || {};
  let providers = productDetails?.provider_details ?? {}
  if (productDetails?.location_details) providers = { ...providers, locations: [productDetails?.location_details] }
  return {
    ...item,
    item: {
      id: productDetails?.id ?? '',
      local_id: productDetails?.local_id ?? '',
      bpp_id: productDetails?.context?.bpp_id ?? '',
      bpp_uri: productDetails?.context?.bpp_uri ?? '',
      domain: productDetails?.context?.domain ?? '',
      tags: productDetails?.item_details?.tags ?? [],
      contextCity: productDetails?.context?.city ?? '',
      quantity: {
        count: item?.count ?? 0
      },
      provider: providers,
      product: {
        ...productDetails?.item_details ?? {},
        subtotal: productDetails?.item_details?.price?.value ?? 0
      },
      userId: item?.userId ?? '',
      deviceId: item?.deviceId ?? ''
    }
  };
}
