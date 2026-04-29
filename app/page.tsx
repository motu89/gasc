import Hero from '@/components/home/Hero'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import FeaturedServices from '@/components/home/FeaturedServices'
import Categories from '@/components/home/Categories'

export default function Home() {
  return (
    <div className="bg-gray-50">
      <Hero />
      <Categories />
      <FeaturedProducts />
      <FeaturedServices />
    </div>
  )
}


