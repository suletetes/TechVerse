# TechVerse E-commerce Platform - API Documentation

## Overview

This document provides comprehensive documentation for the TechVerse E-commerce Platform REST API. The API follows RESTful principles and returns JSON responses.

**Base URL**: `http://localhost:3001/api`  
**Version**: 1.0  
**Authentication**: JWT Bearer Token  

## Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Categories](#categories)
4. [Cart Management](#cart-management)
5. [Wishlist](#wishlist)
6. [Orders](#orders)
7. [Reviews](#reviews)
8. [User Management](#user-management)
9. [Admin Endpooints)
10. [File Upload](pload)
ng)

---

#tion

### POST /auth/register
Register a new user account.

**Request Body:**
`
{
John",
  "lastName": 
m",
  "password": "SecurePass123!
  "confirmPassword": "SecureP23!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registesfully",
  "data": {
    "user": {

   
oe",
      "email": "john.doe@ex.com",

      "isEmailVerified"se,
      "createdAt": "2024-01-"
   }
  }
}
```

### POST /auth/login
Authenticate user and receive en.

**Request Body:**
`
{

  "password":3!"
}
`

**Response (200):**
```json
{
  "success": true,
  "message": "Login succes",
  "data": {
    "user": {
      "_id": "507f1f7",
      "firstName": "John",
      "lastName": "Doe",
     le.com",
   
 
    },

  }
}
```

### POS
Lken.

**Headers:**
```
Aut<token>
``

**Respo(200):**
```json
{
  "success": true,
  "message"
}
```

### GET /auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**R):**
json
{
  "success": true,
 {
    "user": {
011",
      "firstNhn",
      "
 com",
      "role": "use
      "isEmailVerified": true,
 file": {
   890",
",
        "preferences": {
          "notific{
e,
            "push": false
    }
        }
      }
    }
  }
}
```

---

## s

### GET /products
Get paginated list of png.

**Query Parameter**
- `page
-)
- `category` (string): Filtergory slug
-
- `
 filter
- `brand` (string): Filter by brand
- `rating` (number): Minimilter

- `order` (stringc)
- `inSt

**Response (200):**
```json
{
 : true,
  " {
": [
    {

        "name": "iPh,
,
        "descript",
        "price": 999,
,
        "discountPerc
        "images": [
          {
            "url": "/images/iphone-15-pro-1.jp,
            "webp": "/images/iphone-15-pro-1.webp",
            "alt": "iPhone 15 Pro Front View",
            "isPrimary": true
          }
        ],
        "rating": {
          "average": 4.5,
          "count": 128
   },
        "stock": {
       50,
 ,
          "lowStoc: 10
        },
        "ca {
          "_id": 
       s",
          "slug": "smartphon
        },
        "brand": "Apple",
        "status": "active",
        "featured": t,
        "createdAt": "2024-01
      }
    ],
    "paginan": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 100,
      "hasN
      "hasalse,
      "limit": 20
    },
    "filters": {
      "categories": [
        {  25 }
      ],
      "brands": [
        { "name": "Apple"": 15 }
      ],
      "pri
        "min": 99,
        "max": 1999
      }
    }
  }
}
```

### GET /products/:id
Get detailed product influg.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product" {
      "_id",
      "nam
      "slug": "iphone-15-pro",
      "desc
      "longDescription": "Detailed on...",
      "price": 999,
      "comparePrice": 1199,
      "disc 17,
      "ima
        {
          "url": "/images/iphone-15-pro-1.jpg",
          "webp": "/images/p",
          "alt": "iPhone 15 Pro Front View",
       
     }
    ,
      "variants":
        {
          "name": "Color",
          "options": [
            {
              "_id": "col1",
              "ium",
   ,
 
      },

              "_id": or2",
              "value": "Blue Titam",
 20,
             r": 0
       }
 
        },
        {
          "",
          "optio[
            {
     ",
   
 k": 30,
   fier": 0
 },
            {
              "_id": "sto",
56GB",
              "stock": 25,
00
            }
          ]
}
      ],
      "specifications": {
        "Display & Design": [
          {
Size",
   

          },

            "",
            "value": "2556 x 1179 pixels at i"
      }
        ],
e": [
          {
       
 
            "highl
          }
        ]
      },
      "features": [
        "Action Button",
        "Dynamic",
        "
        "USB-C connector"
      ],
      "includes": [
        "iPhone 15 Pro",
        "USB-C to USB-C Cable",
        "Documentation"
      ],
      "rating":
        "average": 4.5,
        "count": 128,
        "breakd": {
          "5"
          "4": 30,
          "3": 15,
          "2": 2,
          "1": 1
        }
      },
      "stock": {
        "quantity": 50,
        ",
        : 10
      },
      "category": {
        "_id": "507f12",
        "name": "Smartphones"
        "slug": "smarphones"
      },
     ple",
   -NT",
 ht": {
   

      },
      "dimensions": {
,
        "width": 70.6,

        "unit": "m"
      },
 ,
      "seo": {
        "title":
        "description": ..",
        "keywords": ["iPhonnium"]
      },
   
 ,
   ,
.000Z"
    }
  }
}
```

### GET /pr
Get related p

**Que
- `

**R00):**
json
{
  "success": true,
ata": {
    "products": [
  {
        "_id": "513",
       
 
        "price": 799,
 9,
   [
 {
            "url": "/images/iphjpg",
            "alt": "iPhone 15",
e
          }
,
        "rating": {
          "average3,
95
        }
  }
    ]
  }
}
```

---

## Categories

### GET /categories
Get all product categories with hierarchy.

**Response (200):**
son
{
  "succe,
 {
    "categories": [
      {
        "_i9012",
        "name": "
        "slug": "electronics",
        "description": "
        "image":",
        "null,
        "subcategories": [
          {
            "_id": "507f1f77bcf86cd799439013",
            ",
            "slug": "smartphones",
         ": 25
          }
        ],
     ,
   
 ve"
   }

  }
}



Get category detaroducts.

*
- `page` (number): Page numucts
-e
- `st)

**Response (200):**
```json
{
  "success": true,
": {
    "category": {
      "_id": "507f1f77,
ones",
      "slug": "smartphones",
,
      "image": "/images/categories/smartphes.jpg",
      "seo": {
,
        "description": "Shop the latest smar",
ones"]
      }
    },
 cts": [
      {
        "_id": "507f1f7,
        "name": "iPhone 15
   : 999,
 ": 128 }
      }

    "pagination": {
      "currentPage": 1,

      "totalProducts": 25
}
  }

```

---

t


Get current user's cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (2
```json
{
  "success": true,
  "data": {
    "cart":{
      "_id": "514",
      "",
      "items": [
        {
          "_id": "507f1f77
          "product{
           9011",
            "name": "iPh
            "slug": "iphone-15-pro,
            "price": 999,
            "images": [
              {
                "url": "/i
                "alt": "iPhon
              }
            ],
          tock": {
              "quantity"
              "trackQue
            }
          },
          "quantity": 2,
          "selectedVariants": {
            "color": "Natura
            "storage": "256GB"
          },
          "unitPrice": 1099,
          "totalPrice": 2198,
          "addedAt": "20
        }
      ],
      "sum": {
        "itemCount": 
        "subtotal": 2198,
        "tax": 175.84,
        "shipping": 0,
        "t
      },
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /cart/add
Add item to cart.

***
```
token>
```


```json
{
  "productId": "",
  "quantity": 2,

    "color": "Natural Titanium",
6GB"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Item",
  "data": {
    "cart": {
    4",
      "items": [
        {
    
          "product": {
            "_id": "5
            "name": "iPhone 15 Pro"
    },
 ,
   2198

      ],
      "summary": {
        "itemCount": 2,
        "t373.84
   
    }
  }
}
```

### PUT /cart/update/:itemId


s:**
```

```

**Request Body:**
```json
{
  " 3
}
```

**Response (200):**
```json
{
  "success": true
d",
  "": {
    "cart"
     ": {
": 3,
      .76
 
    }
  }
}
```

### DELETE
R

*eaders:**
```
Authorization: Bearer <token>
```

**Respons
```json
{
  "succes true,
art",
  "data": {
    "cart
      "summ
": 0,
        
      }
    }
  }
}
```

### DELrt/clear
Clert.

**Headers:**
```
Authorization: Bearer <token>
```

**Res(200):**
```json
{
  "success": true,
  "message"y"
}
```


Validate cart ite.

**H
``

```

**Response (200):**
```json
{
  "success": t
  "data": {
    "validation": {
      "is true,
      "issues": [],
    
       2,
        "total": 23
}
    }
  }
}
`



## W

### GET /wishlist
Get user's wishlist.

**Headers:**
```
Authorization: Beaer <token>
```

*
```json
{
": true,
  "data": {
    "wishlist": {
439016",
   9011",
      "items": [

 ",
    
            "_id": "507f1f77b",
            "name": "iPho
            "slug"pro",
         99,
            "comparePrice": 1199,
  ges": [
              {
                "url": "/images/iphone-15-pro-1.jpg",
                "alt": "iPhone 15 Pro"
              }

            "rating": {
.5,
       ": 128
},
        {
ty": 50,
              "trackQuantity": true
            }
   },
          "a"
        }
      ],
      "itemC 1,
      "updatedAt": "2024-01-01T"
    }
  }
}
```


Add 

**Heers:**
```
An>
```

**Request Body:**
```json
{
  "pro
}
```

**Response (201):**
```json
{

  "messa",
  "data": {
    "wi {
      "item
    }
  }
}
```

### DELETE /wishlist/remove/:ptId
Remove product from wishlist.

**Headers:**

Authori>
``

**Response (200):**
```json
{
  "success": true,
  "messa
}
``

### POST /wishlist/moroductId
Move wisht.

**Headers:**
`
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 1,
  "selectedVariants": {
,
    "storage": "128GB"
  }
}
```

e (200):**
```json
{
  "success": true,
,
  "data": {
    "cart": {

    },
    "wishlist": {

    }
  }
}
```

---

#ders

### GET /orders
tory.

**Headers:**
```
Au<token>
```

**Query Parameters:**
-
- ge
- `status` ( status
- `startDatrmat)
- `endDate` (string): Filormat)

*
```json
{
  "success": true,
  "data": {
    "orders": [
      {
39018",
        "orderNumber": "OR,
        "status": "delivere
id",
        "items": [
          {
            "product": {
              "_id": "50,

              "images[
               {
           ",
 Pro"
        }
              ]
            },
           : 1,
         99,
            "tota9

        ],
        "summar
          "subtotal": 999,
      2,
   
  92
      },
        "shippingAddre {
          "firstName": "John",
          "e",
          "street": "123 Main St",
          "city": "New York,
 "NY",
       01",
          "country": ""
},
        "trackig": {
          "number": "1Z9
          "carrier
          "url": "https://www"
        },
        "createdAt": "2024-01-01T00:00:00.
        "deliveredAt": "2024-01-00.000Z"
      }
    ],
": {
      "currentPage": 1,
      "total
      "totalOrde15
    }
  }
}
``

### 
Get detrmation.

**Headers:**
```
Authorization: Bearer <token>
```

**R0):**
```json
{
 true,
  "data": {
    "order": {
      "_id": "507f",
   
      "status": "delivered",
",
      "items": [
        {
   9",

       
            ",
   
            "images": [
              {
                "u
               Pro"
       
     
          },
          "quantity": 1,
          "selectedVariants"
       
            "storage"
          },
          9,
       9
     
      ],
      "summary": {
        "subtotal": 999,
  79.92,
        "sh
        "discount": 0,
        "to92
      },
      "shs": {
    
        "lastName": "D,
        "street": "123 Mat",
        "apartment": "Apt 4B",
     k",
        "st",
        "zipCode": "10001",
        "country": "United States",
        "phone": "+567890"
      },
      "billingAddress": {
        "fiJohn",
        "lastName": "D",
        "street",
    ork",
        "state""NY",
1",
        "country": "UnitStates"
      },
{
        "method": "credit_card",
        "last4": "4242",
        "brand": "visa",
890"
      },
      "tracking": {
   
",
   
   d"
      },
      "timeline": [
        {
          "status": "p",
 000Z",
          "notplaced"
        },
        {
          "status": "processing",
          "timestamp": "2024-
         nfirmed"
        },
        {
    d",
          "timestamp": "2024-01-02T10:00:00.0,
          "note": "Order shipS"
        },
        {
          "status": "delivered",
          "timestamp"
          "ned"
        }
      ],
      "create
      "updatedAt": "2024-01-
    }
  }
}
```

### POST /ordrs
Creart.

**Headers:**
```
Au
```

**Request Body:**
```json
{
  "shippingAddress": {
",
    "lastNamee",
    "st St",
Apt 4B",
   ew York",
    "state": "NY",
    "zi",
",
    "phone": "+1234567890"
  },
s": {

   ",
 ,
   ",
    "state": ",
    "zipCode": "10001",
    "country": "Unites"
  },
  "paymentMethod": {
    "t
    "token": "tok_1234567890",
    "saveCard": false
  },
  "shippingMethod": "standa",
  "notes": "Pleadoor"
}
```

**Response (201):**
```json
{
  "success": true,
  "ully",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439018",
      "orderNu
  ,
      " 1078.92
    }

}
```

---

views

### GET /reviews/product/:productId
.

**Query Parameters:**
number
- `limit` (number): Reviews per page
)
- `sort` (string): pful)
- `verified` (boolean): Filter verified purconly

**Response (200):**
```json
{
  "success": true,
ta": {
    "reviws": [
      {
        "
        "user": {
          "_id"11",
          "firstName,
          "lastName": .",
          "avatar": "/images/avatars/jopg"
        },
     439011",
    
        "title":",

        "pros": [
      
          "Long ba
          "Fast performance"
        ],
        "cons": [
",
          "No charger included"
        ],
": [
          {
",
            "alt"
          }
       ,
        "verified": true,
pful": {
          "count": 5,
          "userVoted":se
   },
     ,
 .000Z"
      }
    ],
    "pagination": {
      "currentPage"1,
      "totalPages": 10,
      "totalReviews": 128
    },
    "summary": {
      "averageRating":
      "totalReviews": 128,
 down": {
    80,
        "4": 30,
        "3
        "2": 2,
 1
      },
      "verifiedPurc": 95
    }
 
}
```

### POST /reviews
Create a new product reew.

*ders:**
```

```

y:**
```json
{
  "pr
 
  "!",
  "co",
  "pros": [
    "Amazing camera",
    "Long battery life"
  ],
  "cons"
    "Ee"
  ],
  "images": [
    {
      "url": "/images/reviews-1.jpg",
      "alt": "Came
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted succ,
  "data": {
    "review": {
      "_id": "507f1f77bcf86cd
      "rating": 5,
      "title": "Excellent phone!",
     "
    }
  }
}
```

### PUT /reviews/:id
Update user's own review.

**Headers:**
```
Aur <token>
```

*y:**
```json
{

  "title": "Good phone with minor issues",
  "commen.."
}
```

**Response (200):**
json
{
,
  "message": "Review updated successfully"

```

s/:id
Dw.

**Headers:**
```
A
```

*
```json
{
  "success": true,
  "messagey"
}
```

### POST /reviews/:helpful
Mark review as helpful.

**Headers:**

Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
l",
  "data": {
  16
  }
}
```

---

## User Management

###ile
Get current user's det

**Headers:**
```
Authorization: Bearer <token>
```


```j
{
  "success": true,
  "data": {
    "user": {
      "_id": "50",
      "f
     ",
      "m",
      "role": "user",
      "isEmailVerified": true,
      "profile": {
        "phone": "+1234567890",
        "dateOfBirth": "191",
        "avatar": "
        "preferences": {
          "not{
            "email": true,
     
           ": false
          },
          "privacy": {
            "profileVisibc",
            "showPurchaseHislse
         },
     
          "currency": "USD",
          "timezone": "America/New_York"
        }
      },
      "addresses": [
        {
          "_id": "507f1f77bcf86cd79943901b",
          "type": "home",
          "firstN "John",
          "lastName": "Doe",
",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country",
          "phone": "+12
          "isDefault": tre
       }
      ],
      "paymentMethods"
        {
          "_id":
 d",
          "",
          ",
th": 12,
          "expiryYear": 2025,
          "isDefault": true
        }
      ],
      "stats": {
        "totalOrders": 15,

        "reviewsCount": 8,
        "wishlistCount": 3

      "createdAt": ""
    }
  }
}
```

### PU.nt teamevelopmethe dct please contans,  or questioupportnal sr additio Folatform.merce PVerse E-comor the Techty functionalind foints aPI endp major Aovers allmentation c
This docu--
``

-
`0Z"
}T00:00:00.0001 "2024-01-":"timestamp  },
  
    }
078.92l": 1     "tota01",
 4-0ORD-202mber": " "orderNu   ",
  d799439018cf86c77b07f1fd": "5    "_i
  er": {{
    "ord"data": 
  ed",eatorder.cr "event":{
  "```json
t

yload Formahook Pa

### WebregistrationNew user `: edr.registernged
- `useation chainformduct dated`: Prooduct.up `prrocessed
-Payment ppleted`: ment.comnged
- `paystatus cha Order r.updated`: `orde
-rder placedw ocreated`: Neder.- `orvents

ported E### Supons:

ficatinoti-time oks for realrts webhouppoI sAPoks

The hoeb

## W=asc`

---der=price&orphones&sortegory=smartphone&catrch=iroducts?sea: `/api/pxample desc)

Eon (asc,ort directi`: S
- `order) etc.eatedAt,e, cr(name, pric by ld to sortt`: Fie- `sorrs

rt Parameteon So### Commering

 filt Price rangemaxPrice`:nPrice` / `ring
- `mi range filtee`: Date `endDatartDate` / `stus
- statFilter bys`: statuor slug
- `category ID Filter by category`: ields
- `s relevant farch acrossech`: Text 
- `seararameters
n Filter P

### Commog & Sortinglterin

## Fi

---}
}
``` 20
  limit":e,
    " falsage":evPasPre,
    "h tru":hasNextPage
    "0,lItems": 20   "tota": 10,
 talPages
    "to: 1,urrentPage"    "c: {
pagination"  "json
{
rmat:**
```se Fo
**Respon)
 by endpointriest vaage (defaulper pt`: Items limirom 1)
- `er (starts fPage numb- `page`: meters:**
*Query Paraormat:

*t fconsistenfollow a nts dpoiaginated enon

All p## Paginati

---

CJ9...
```R5cCI6IkpXVI1NiIsIniOiJIUzr eyJhbGcon: Bearezati``
Authori
`header:n orizatioin the AuthJWT token he clude t
InHeaders
 Request ###ngs

ttitem sesyss`: Manage ttingn:seics
- `admiytalw an Vieics`:nalyt `admin:asers
-`: Manage u:usersrs
- `adminll ordenage arders`: Madmin:oucts
- `all prodManage acts`: in:produ
- `admons:**min Permissi**Adofile

prdate own rofile`: Up:ptewriile
- `w own proffile`: Vieroread:previews
- `ws`: Write ite:reviers
- `wrace ordeorders`: Plite:t
- `wrcarage t`: Manite:car
- `wrew productss`: Viead:product:**
- `rPermissionser *Usstem:

*ermission syrole-based p uses a APIhe 
Tm
n Systessio
### Permi`
600
}
``41081"exp": 16995200,
  1640  "iat": cart"],
te:s", "wriduct"read:pro: [ns" "permissiouser",
 "role": "
  ,m"e.coampljohn.doe@ex"email": "011",
  39bcf86cd7994"507f1f77"sub":   
{
jsonclaims:
```ollowing ain the fkens cont
JWT toat
Token Form JWT tion

###riza & Authontication Authe

---

##00
```6409952t-Reset: 1ateLimiing: 95
X-RinRemateLimit-Ra: 100
X-itteLimit-Lim`
X-Ra``esponses:
d in re includeers arlimit head

Rate serinute per uests per m 10 requ*:d endpoints*uploa- **File  per admin
er minute requests pts**: 200in endpoindmser
- **Aper ur minute quests pe re: 100endpoints**ral API *Gene
- *e per IPs per minutest: 5 requdpoints**tion en*Authenticase:

- *buprevent alimited to  are rate dpointsPI enimiting

A# Rate Ltion

##ifica modreventsder status p: OrDIFIED`MONOT_BE_ER_CAN `ORDailed
- fssingocePayment pr`: FAILED`PAYMENT_vailable
- tock aough sT`: Not enENUFFICINSTOCK_I`S
- estsequy r manED`: TooEXCEEDMIT_ATE_LI- `Rists
 exeadyce alrCE`: ResourATE_RESOURPLICst
- `DU exis notresource doeequested OUND`: RNOT_FOURCE_ `RESrmissions
-required peser lacks ISSIONS`: UPERMICIENT_d
- `INSUFFken requirecation to authentiRED`: ValidUIATION_REQUTHENTICiled
- `Alidation fa Request vaON_ERROR`:
- `VALIDATIdes
 Con Errorommo
### Cer error
Servor**:  Erral Server500 Intern- **d
 exceedelimitsts**: Rate  Requeo ManyTo
- **429 ion errors**: Validatle Entityssabproce*422 Un
- *ail)cate empli.g., dunflict (ee coourc: Resct**fli**409 Cond
- ot foun: Resource n Found**04 Not*4s
- *issionrmpeufficient  Insen**:3 Forbidd40 **required
-ication ent: Authorized****401 Unautht data
- valid reques: In Request****400 Badsfully
- ted succesrea: Resource created**
- **201 Cssfult succeReques*200 OK**: - *des

tus Co### HTTP Sta
}
```

67890"2345req_1: "stId"que,
  "re00Z"00.001-01T00:00:24-": "20tamp"times  },
  
    ]
     }racters"
 st 8 chaeat lust be asword m": "Pas "message",
        "password": "field
             {},
     "
 equired"Email is rmessage":         "",
": "email"field       {
     [
  :  "details"led",
   faidation li": "Vasage    "mes",
ORON_ERR"VALIDATI code": "or": {
   "err  se,
cess": fal
  "suc```json
{at:

t form consistenollow arors ferAPI All mat

Response Forr 
### Erro
dling# Error Han-

#`

--
}
``}
  } 51200
       "size":jpg",
   d799439011.86c7bcf507f1f7atars/user-mages/av/i"url": "     tar": {
 ava
    "ta": {",
  "dauccessfully s uploaded": "Avatar  "messagerue,
ss": t "succe
 
{**
```json0):(20**Response 
e
e filvatar image - Ar`: Filavata
- `m Data):**t Body (Forues**Req
```

rm-datatipart/foulpe: montent-Tyn>
Carer <tokeon: Beorizati```
Autheaders:**
.

**Hr imagevataad user aplor
Uavatauser-ad/OST /uplo# P##
}
}
```
   ]
  
  }
      }  0
     t": 60  "heigh   
     dth": 800,"wi
          ions": {imens       "d
 245760, "size":      ew",
  Viront 15 Pro Fe t": "iPhon      "al
  o-1.webp",hone-15-prroducts/ipes/p"/imag"webp":    ,
     -pro-1.jpg"15hone-ucts/ipages/prod"/im": url       "{
 
       [es":
    "imaga": {"dat
  ",essfullyded succploamages u": "Imessage  " true,
uccess":"s
{
  n``jso00):**
`nse (2*Respo

*magesor it ftextring - Alt t`: S)
- `alional ID (opt Product`: String - `productIdto upload
-les Image fi) - e(s Fil- `images`:*
orm Data):*uest Body (F**Reqata
```

/form-dartpe: multipnt-Tyn>
Conte_tokearer <adminzation: Be
Authori`aders:**
``*He
*ges.
ct imaload produages
Upproduct-im /upload/ POSTad

##### File Uplo

---


  }
}
```  }    }
  : 15
  oderator""m  5,
      "admin": 2       : 15380,
  "user"       {
": leBreakdown
      "ro,Month": 456This"new  
    : 14850,s"ctiveUser      "a5420,
 1alUsers":"tot {
      ":"summary   ,
 5420
    } 1otalUsers":"t
      ": 200,otalPages   "t": 1,
   rrentPage"cu {
      on":  "paginati
  
    ],  }Z"
    00.00000:24-01-01T00:": "20Atgin"lastLo     ,
   00Z"0:00.015T00:0"2023-06-atedAt":   "cre
      },"
        :00.000ZT00:001-01-024"20te": stOrderDa    "la      0.75,
 1245Spent":"total       ": 15,
   Orders"total
          s": {at   "sttrue,
     ": ilVerified"isEma  e",
      ": "activtatus"s        r",
"use"role": 
        m",example.codoe@": "john.il     "ema",
   oe": "D"lastName
        n",": "Joh"firstName     011",
   9439f86cd79"507f1f77bc"_id":  {
            ers": [
     "us{
  "data": true,
": "success n
{
 :**
```jso00)*Response (2
*range
 date ationegistrby rng): Filter trite` (strationDagis
- `retustaaccount s by ter Fil(string):tatus` - `sle
ror y useer bng): Filt(stri`role` mail
-  eme orSearch by nang): arch` (strie
- `seer pager): Users pnumbit` (
- `lim numberPageumber): (n`page` rs:**
- metePara

**Query _token>
```rer <admination: Beathoriz
Au
```ders:**

**Heaanagement.for admin mll users sers
Get aGET /admin/u
### 
```

  }
} } }
   
     90"12345678Z999AAber": "1      "num": {
  tracking   "
   g", "processin "status":  18",
   cd799439086"507f1f77bcf"_id":     ": {
    "order{
  a": "dat",
  essfullyucc satus updated"Order st:  "message"": true,
 
  "success
{son):**
```jponse (200**Res

 }
}
```
 34567890"=1Z999AA12racknum/track?tps.comw.uwwtps://"url": "ht    
"UPS",ier":    "carr
 234567890", "1Z999AA1mber":"nu    cking": {
tra
  " true,r":Customefy "noti",
 ipmentaring for shmed, prepfirent con: "Paym
  "note"sing",oces: "prtatus"
{
  "sony:**
```jsuest Bod**Req
```

en>min_tokarer <adzation: Be```
Authoriaders:**


**Heatus.e order status
Updatd/stn/orders/:imiad## PUT /
#```
 }
}

    }
   }
     12":celled"can       4,
 ": 23livered      "de": 89,
  hipped    "s
    ng": 67,rocessi
        "p,: 45ing""pend{
        n": kdowtusBrea   "sta  ": 85.75,
 derValuegeOrera  "av.50,
    125000": evenue  "totalR   mary": {
     "sum0
    },
": 250alOrderstot  "
    ": 100,lPages   "tota 1,
   tPage":    "curren{
  : pagination"  " ],
        }
   0Z"
0:00.001T00:0-0-0124"20eatedAt":   "cr      },
  "
      nited States"U":   "country       "NY",
 state":     ",
      k""New Yor"city": 
           {ess":Addring "shipp
       078.92,l": 1      "tota
  ,ount": 2itemC  "    ",
  : "paid"mentStatus    "pay   ,
 g"pendin "status":       "   },
      ple.com"
oe@exam": "john.d   "email     ",
   "Doe":  "lastName    ohn",
    ": "JrstName   "fi    
   1",43901799f77bcf86cd": "507f1_id          " {
":mer  "custo",
      100ORD-2024-": "mberrNu"orde   
     439018",99cd7f77bcf86"507f1   "_id":     {
     rs": [
      "orde
": {ta
  "da": true,
  "success
{on`js):**
``200ponse (

**Resomermber or custy order nuSearch b (string): arch`ate
- `seFilter to d` (string): dDatee
- `enr from datng): Filtete` (stritDa
- `starent statuslter by paym): Fitringus` (smentStat`paystatus
- r by order ng): Filtestristatus` (
- ` page Orders per` (number):
- `limitnumberPage ber): ge` (numpa*
- `ters:*y Parame

**Quer``
`_token> <adminion: Beareratuthorizs:**
```
A
**Header
ment.nageor admin mal orders ft aln/orders
Gemi# GET /ad
```

##}
  }
}-NT"
    O-MAX-256-PRIPHONE-15: " "sku"  max",
   o-prhone-15-g": "ip     "sluax",
 5 Pro Mne 1e": "iPho"nam
      20",d79943907f1f77bcf86c_id": "50
      "": {uct   "prod
 ta": {  "da",
llysfuted succesProduct creaessage": "e,
  "mcess": trusuc
{
  ":**
```json01)*Response (2`

*
``ue
}ed": tr "featurtive",
 ": "ac "status  },
 ax"]
 "Pro M "Apple",hone",ds": ["iPwor"key   Max...",
 Pro  15 e the iPhone"Experiencn": tiocripes",
    "dgest iPhonero Max - Larone 15 PiPhe": "titl": {
    ""seo },
   10
 Threshold": "lowStockue,
   antity": tr"trackQu    100,
 quantity":
    ": {tock",
  "s  ]sland"
"Dynamic I
    ",ction Button   "As": [
 
  "feature ]
  },    }
   : true
  "highlight"
        na XDR", Retiuperh S"6.7-inc"value":      ",
   eSiz: "Display abel"    "l
     {: [
     " & Design"Display{
    ications": 
  "specif
    }
  ],}
      ]
        ": 0ierriceModif      "p0,
    "stock": 3        m",
   Titaniu"Natural"value":             {
   ": [
   "options   olor",
   ": "Cname   "{
   
    ": [iants
  "var  }
  ],
  : truey"  "isPrimar    ",
t ViewMax Frono 15 Pr "iPhone ":    "alt",
  max-1.jpg-15-pro-ges/iphone: "/ima"url"  
    {
    : ["  "images-NT",
-MAX-256E-15-PRO": "IPHON,
  "sku""Applerand": ",
  "b39012d799486c7bcf507f1f7": "egory  "cat
99, 13rice":"compareP
  ,ice": 1199"pr",
  ...ionriptuct desced prod": "DetailcriptionongDes"ls",
  nced featureadvaone with rgest iPhhe lan": "Tio "descriptro Max",
 iPhone 15 P""name": {
  son

```jst Body:**
**Reque``
en>
`admin_tokarer <rization: Be
Autho:**
```derseaduct.

**Hte new proucts
Creaprod/admin/ST `

### PO}
}
``    }

      ]
  45 }unt": aft", "co "dr":atus      { "st,
  ": 1180 } "countctive",": "aatus     { "st: [
   tuses""sta         ],
   : 15 }
 "count"",pple: "A""name        { rands": [
"b,
      5 }
      ]t": 2s", "coun"Smartphone: "name"    {   es": [
  egori      "cat: {
"filters"      },
  1250
 ":talProducts"to    ": 50,
  "totalPages,
      tPage": 1    "curren  {
": agination   "p
  }
    ],"
     0:00.000Z0:024-01-01T0dAt": "20te "upda",
       .000Z:00T00:00"2024-01-01eatedAt":         "cr },
28
       unt": 1 "co   5,
      4."average":          
  {ng":  "rati
            },55844
  : 1ue" "reven      
   tal": 156,        "to
  {es":       "sal
  true,red":   "featu
      active",": "   "status },
     "
       _stocktus": "in   "sta      ty": 50,
 uanti  "q        : {
  "stock"     ",
 "Appled": an       "br  },
 
      phones" "smart "slug":     
    tphones", "Smarme":"na    ": {
       "category9,
       ice": 119omparePr "c    ": 999,
   ce       "priT",
 8-NE-15-PRO-12: "IPHON  "sku"o",
      ne-15-pr"iphoug":   "sl      15 Pro",
ne : "iPho"name"  ",
      011799439cf86cd7f1f77b"_id": "50
             {
 : [""products     {
":"datae,
  ccess": trun
{
  "su*
```jsoe (200):*nsspoer

**Rerdt oing): Sor`order` (str
- y field: Sort bt` (string)- `sorof_stock)
ock, out_ck, low_stin_sto stock (ter byng): Fil (stri
- `stock`ved)aft, archiive, dr(actstatus er by ng): Filt(stri `status` ategory
-Filter by cg): strinategory` (ucts
- `carch prodg): Serch` (stringe
- `sea paucts perumber): Prodit` (nber
- `lime number): Pag (num**
- `page`eters:Query Param`

**
``oken>min_tarer <ad Bezation:oriuth
```
Ars:**

**Headeagement. admin mants forroducl pGet alproducts
GET /admin/
### 
}
```

    ]
  }  }4
    ue": 15584   "reven   ,
  ": 156sle"sa        ro",
ne 15 P": "iPhoame"n        11",
994390f77bcf86cd7"507f1": "_id            {
 ucts": [
 Prodtop ],
    "   
      }
": 10ld"thresho     
   ": 5, "stock
       e 15 Pro","iPhon"name":       
  11",3906cd799407f1f77bcf8"5d":        "_i  {
   
  ts": [wStockProduc,
    "lo
    ]  }    .000Z"
:00:0024-01-01T00edAt": "20     "creat,
   "pending"s": statu   ".92,
     ": 1078otal    "t,
    oe""John D: mer""custo   
     ",01"ORD-2024-0ber": Numrder"o     
   9439018",cd79bcf861f7707f"_id": "5   {
      [
      entOrders": "rec    },
      }
  ": 67
  "lowStock       5,
OfStock": 2out
        "draft": 45,  "      80,
11ublished":      "p  ": 1250,
 tal"to     {
   products": ,
      "    }
  s": 8750"activeUser        6,
": 15ewThisWeek
        "nay": 23,    "newTod,
    ": 15420 "total   
    "users": {          },
  d": 89
 "shippe       ": 67,
sing    "proces    : 23,
""pending     : 1205,
   thisMonth"      ",
  : 287k"thisWee       "": 45,
 oday      "trs": {
  "orde},
         }
          y": 15.7
 "monthl          y": 8.3,
   "weekl.5,
       ": 12aily     "d{
     wth":     "gro    342150.75,
": sMonth    "thi,
    9750.25Week": 8his"t        50,
420. 15"today":     es": {
   "sal{
      metrics": "": {
     "data
 ": true,ccessn
{
  "su
```jso0):**e (20espons```

**Ren>
_toker <adminearn: Brizatioutho``
Aers:**
`

**Headics.rd analytdmin dashboa
Get aboardn/dash## GET /admipoints

#Admin End## -

}
```

-- }
}
 
    es": 45titalActivi"to,
      es": 5otalPag"t       1,
e":rrentPag"cu  
    ion": {natgi"pa ],
          }
   00.000Z"
-02T00:00:-01024": "2imestamp    "t   },
         ting": 5
     "ra",
     e 15 Proon"iPhtName": roduc    "p",
      d79943901177bcf86c "507f1fuctId": "prod{
         : "metadata"        Pro",
  15ewed iPhone"Revi": ption  "descri,
      submitted"review_type": " "   1f",
    cd7994390f1f77bcf8607: "5   "_id"     ,
      {
"
      }:00.000Z-01-01T00:002024"mp": timesta    "  },
       2
   078.9total": 1          "001",
"ORD-2024-mber": orderNu ",
         9018"cd799437bcf86f1f7": "507derIdor       "   : {
etadata"  "m1",
      4-00 ORD-202erord"Placed ption": "descri      ,
  r_placed" "orde"type":        ",
01e43977bcf86cd7997f1f: "50"_id"             {
 [
 ":esvitiacti{
    "":   "datarue,
: tuccess"
  "sjson
{**
```se (200):*Respontype

*ivity lter by act): Fi (stringtype`- `er page
ies p): Activit(number` - `limitnumber
 Page ` (number):age
- `p**s:y Parameter``

**Quer
`token> <on: Bearerizati
```
AuthorHeaders:**

**y history.er's activitGet usctivity
s/a# GET /user
##}
```
    ]
  }
}
   00Z"
   :00:00.01-01T00-0"2024: "reatedAt"c        true,
 ":"isDefault        ,
 Doe" "Johne": "holderNam5,
       yYear": 202xpir        "eth": 12,
iryMon"exp       sa",
 : "vind" "bra
       ",4242 "last4":      "_card",
  it: "cred    "type"    ",
1c4390d79977bcf86c07f1f"_id": "5 {
        [
     thods": tMepaymen   "": {
   "data": true,
"success  json
{
```(200):**
e 
**Respons
```
token>r <ion: Beare
Authorizat``:**
`derss.

**Heahod metmentsaved payer's t us
Geodsyment-meths/pa# GET /user`

##}
}
``
  
    }"siness Ave56 Bu"4"street":      rk",
 ": "wo"type",
      9943901df86cd77f1f77bc": "50_id
      "ess": {
    "addr": {
  "data",cessfullyuced sss add": "Addre"message,
  ss": trueucce"s
{
  `json201):**
``*Response (``

*e
}
`lsefault": fa
  "isD90", "+12345678"phone":
   States", "Unitedry":nt
  "cou0002",e": "1odipC"z"NY",
  e": 
  "stat,York"w ": "Necity",
  "Suite 100rtment": ",
  "apas Ave" Busines": "456eet"str",
  e": "DoelastNam
  "n",: "JohrstName"",
  "fi"worke": typ
  "json
{```t Body:**
ues``

**Reqr <token>
`ion: Beare
Authorizat``rs:**
`Heade.

**ddressew aAdd nesses
drers/ad/usT # POS
##
}
```
   ]
  }   }
 .000Z"
   01T00:00:0024-01-dAt": "20reate      "c
  ": true,fault      "isDe
  34567890",e": "+12 "phon   tes",
    ed Sta"Unitry":     "count",
    10001ode": ""zipC
        NY",state": "    "    rk",
New Yo": "     "city",
   : "Apt 4Bent"   "apartm",
     Stin  "123 Maet":tre  "s     
 e",": "DoName  "last    ,
  n"me": "Joh"firstNa     e",
   "hom"type":      ,
   "901bcd799437f1f77bcf86"_id": "50            {
 sses": [
 
    "addrea": {ue,
  "dat trs":"succeson
{
  0):**
```js20nse (
**Respo
```
 <token>tion: Bearer
Authoriza
```rs:**de

**Hea addresses.saved's t userresses
GeT /users/add

### GE
```
  }
}oe"
    }": "DlastName      "ohn",
Name": "J    "first11",
  390994f86cd71f77bc": "507fid   "_{
   user": 
    ""data": {lly",
  fuated successpdfile u": "Proge "messa
 ": true, "success`json
{
 200):**
``sponse (`

**Re
``"
  }
}": "USD "currency   "en",
nguage": la  },
    "false
  "push":     e,
  l": tru     "emai": {
 tifications{
    "nonces": rerefe",
  "p"1990-01-01irth": 
  "dateOfB7890",56": "+1234hone
  "p"Doe",Name": "last  ,
": "John""firstNameson
{
  y:**
```j*Request Bod
```

*>entokarer <ation: Beuthoriz
```
Aders:**

**Heaformation.ofile inpr user Updaterofile
rs/puseT /