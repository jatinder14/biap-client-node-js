// utils.js
export async function transformProductDetails(item, productsDetailsArray) {
  const productDetails = productsDetailsArray.find(el => item.item_id === el.item_details.id) || {};

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
      provider: productDetails?.provider_details ?? {},
      product: {
        ...productDetails?.item_details ?? {},
        subtotal: productDetails?.item_details?.price?.value ?? 0
      },
      userId: item?.userId ?? '',
      deviceId: item?.deviceId ?? ''
    }
  };
}
