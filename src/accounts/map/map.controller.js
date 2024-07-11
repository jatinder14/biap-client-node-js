import got from "got";

class MapController {
  async mmiToken(req, res, next) {
    try {
      let params = {
        grant_type: "client_credentials",
        client_id: process.env.MMI_CLIENT_ID,
        client_secret: process.env.MMI_CLIENT_SECRET,
      };

      var paramsData = new URLSearchParams();
      paramsData.append("grant_type", params.grant_type);
      paramsData.append("client_id", params.client_id);
      paramsData.append("client_secret", params.client_secret);

      let headers = { "Content-Type": "application/x-www-form-urlencoded" };

      let result = await got.post(
        "https://outpost.mapmyindia.com/api/security/oauth/token",
        {
          body: paramsData.toString(),
          headers,
          responseType: 'json',
        }
      );

      res.send(result.body);
    } catch (error) {
      next(error);
    }
  }

  async getCoordinates(req, res, next) {
    try {
      const result = await got(
        "https://api.geoapify.com/v1/geocode/search",
        {
          searchParams: {
            postcode: req.query.postcode,
            apiKey: process.env.MAP_API_KEY,
          },
          responseType: 'json',
        }
      );

      if (result.body.features[0] == undefined) {
        return res.status(400).json({
          success: false,
          message: "Invalid pincode",
        });
      }
      return res.status(200).json({
        success: true,
        data: {
          longitude: result.body.features[0].properties.lon,
          latitude: result.body.features[0].properties.lat,
          pincode: req.query.postcode,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getPincode(req, res, next) {
    const { lat, lon } = req.query;

    try {
      const result = await got(
        "https://api.geoapify.com/v1/geocode/reverse",
        {
          searchParams: {
            lat: req.query.lat,
            lon: req.query.lon,
            apiKey: process.env.MAP_API_KEY,
          },
          responseType: 'json',
        }
      );
      const { country, city, postcode } = result?.body?.features[0]?.properties;

      if (result?.body?.features[0]?.properties == undefined) {
        res.header("Access-Control-Allow-Origin", "*");
        return res.status(400).json({
          success: false,
          message: "Invalid Coordinates",
        });
      }
      return res.status(200).json({
        success: true,
        data: {
          postcode: postcode,
          city: city,
          country: country,
        },
      });
    } catch (err) {
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).json({
        success: false,
        message: "Invalid Coordinates",
      });
      next(err);
    }
  }

  static async getCoordinatesByPincode(pincode) {
    try {
      const result = await got(
        "https://api.geoapify.com/v1/geocode/search",
        {
          searchParams: {
            postcode: pincode,
            apiKey: process.env.MAP_API_KEY,
          },
          responseType: 'json',
        }
      );

      if (!result?.body?.features[0]) {
        throw new Error("Invalid pincode");
      }

      return {
        success: true,
        data: {
          longitude: result?.body?.features[0]?.properties?.lon,
          latitude: result?.body?.features[0]?.properties?.lat,
          pincode: pincode,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

export default MapController;
